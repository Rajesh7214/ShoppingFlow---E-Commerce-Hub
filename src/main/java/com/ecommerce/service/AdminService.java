package com.ecommerce.service;

import com.ecommerce.dto.AdminMetricsResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public AdminService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AdminMetricsResponse getPlatformMetrics() {
        BigDecimal revenue = orderRepository.sumTotalRevenue();
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.countByActiveTrue();
        long totalCustomers = userRepository.countByRole(User.Role.ROLE_CUSTOMER);
        long lowStock = productRepository.countByStockQuantityLessThanAndActiveTrue(10);
        long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PENDING) +
                orderRepository.countByStatus(Order.OrderStatus.PAID);

        return new AdminMetricsResponse(
                revenue != null ? revenue : BigDecimal.ZERO,
                totalOrders,
                totalProducts,
                totalCustomers,
                lowStock,
                pendingOrders
        );
    }
}
