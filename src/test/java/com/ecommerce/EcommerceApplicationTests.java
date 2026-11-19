package com.ecommerce;

import com.ecommerce.dto.AuthRequest;
import com.ecommerce.dto.AuthResponse;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.entity.User;
import com.ecommerce.service.AuthService;
import com.ecommerce.service.CartService;
import com.ecommerce.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EcommerceApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CartService cartService;

    @Test
    @DisplayName("Context Loads Successfully")
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(productService);
        assertNotNull(cartService);
    }

    @Test
    @DisplayName("Verify User Authentication & JWT Generation")
    void testUserAuthentication() {
        AuthRequest request = new AuthRequest("customer@store.com", "Customer@123");
        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("customer@store.com", response.getEmail());
        assertEquals("ROLE_CUSTOMER", response.getRole());
    }

    @Test
    @DisplayName("Verify Product Catalog Search and Pagination")
    void testProductSearch() {
        Page<ProductResponse> products = productService.getProducts(
                "Headphones", null, null, null, 0, 10, "id", "asc"
        );

        assertNotNull(products);
        assertFalse(products.isEmpty());
        assertTrue(products.getContent().get(0).getName().contains("Headphones"));
    }

    @Test
    @DisplayName("Verify Featured Products Retrieval")
    void testFeaturedProducts() {
        List<ProductResponse> featured = productService.getFeaturedProducts();
        assertNotNull(featured);
        assertFalse(featured.isEmpty());
        assertTrue(featured.size() <= 8);
    }
}
