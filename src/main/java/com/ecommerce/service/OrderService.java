package com.ecommerce.service;

import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.OrderStatusUpdateRequest;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        CartService cartService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.cartService = cartService;
    }

    @Transactional
    public OrderResponse checkout(User user, CheckoutRequest request) {
        Cart cart = cartService.getOrCreateCart(user);

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty shopping cart");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        // Generate unique Order Number
        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String orderNumber = "ORD-" + datePrefix + "-" + randomSuffix;

        BigDecimal shippingFee = (cart.getTotalAmount().compareTo(BigDecimal.valueOf(50)) >= 0)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(5.00);

        BigDecimal taxAmount = cart.getTotalAmount().multiply(BigDecimal.valueOf(0.08))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal totalAmount = cart.getTotalAmount().add(shippingFee).add(taxAmount);

        Order order = new Order(
                orderNumber,
                user,
                cart.getTotalAmount(),
                shippingFee,
                taxAmount,
                totalAmount,
                request.getPaymentMethod(),
                request.getFormattedAddress()
        );

        // Deduct inventory & create order items snapshot
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName() +
                        ". Available: " + product.getStockQuantity());
            }

            // Deduct stock
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem(
                    order,
                    product,
                    product.getName(),
                    product.getImageUrl(),
                    cartItem.getQuantity(),
                    cartItem.getUnitPrice()
            );
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        Order savedOrder = orderRepository.save(order);

        // Clear shopping cart after successful checkout
        cartService.clearCart(user);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForUser(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByNumber(User user, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        if (!user.getRole().equals(User.Role.ROLE_ADMIN) && !order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to view this order");
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse cancelOrder(User user, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        if (!order.getUser().getId().equals(user.getId()) && !user.getRole().equals(User.Role.ROLE_ADMIN)) {
            throw new BadRequestException("You do not have permission to cancel this order");
        }

        if (order.getStatus() == Order.OrderStatus.SHIPPED || order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel an order that is already " + order.getStatus());
        }

        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restock products
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);
        return OrderResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(OrderResponse::fromEntity);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String orderNumber, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        try {
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());
            order.setStatus(newStatus);
            if (newStatus == Order.OrderStatus.DELIVERED) {
                order.setPaymentStatus(Order.PaymentStatus.COMPLETED);
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + request.getStatus());
        }

        Order updated = orderRepository.save(order);
        return OrderResponse.fromEntity(updated);
    }
}
