package com.ecommerce.dto;

import com.ecommerce.entity.Cart;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CartResponse {
    private Long id;
    private List<CartItemResponse> items = new ArrayList<>();
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal estimatedTax;
    private BigDecimal totalAmount;
    private int totalItems;

    public CartResponse() {}

    public static CartResponse fromEntity(Cart cart) {
        CartResponse res = new CartResponse();
        res.setId(cart.getId());
        if (cart.getItems() != null) {
            res.setItems(cart.getItems().stream()
                    .map(CartItemResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        BigDecimal subtotal = cart.getTotalAmount();
        res.setSubtotal(subtotal);
        res.setTotalItems(cart.getTotalItemCount());

        // Free shipping if subtotal >= $50, else $5.00 flat
        BigDecimal shipping = (subtotal.compareTo(BigDecimal.valueOf(50)) >= 0 || subtotal.compareTo(BigDecimal.ZERO) == 0)
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(5.00);
        res.setShippingFee(shipping);

        // 8% estimated sales tax
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.08)).setScale(2, java.math.RoundingMode.HALF_UP);
        res.setEstimatedTax(tax);

        res.setTotalAmount(subtotal.add(shipping).add(tax));
        return res;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public List<CartItemResponse> getItems() { return items; }
    public void setItems(List<CartItemResponse> items) { this.items = items; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public BigDecimal getEstimatedTax() { return estimatedTax; }
    public void setEstimatedTax(BigDecimal estimatedTax) { this.estimatedTax = estimatedTax; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public int getTotalItems() { return totalItems; }
    public void setTotalItems(int totalItems) { this.totalItems = totalItems; }
}
