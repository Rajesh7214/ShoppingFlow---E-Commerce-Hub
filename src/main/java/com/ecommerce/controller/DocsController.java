package com.ecommerce.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/docs")
public class DocsController {

    @GetMapping(value = "/spec", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getApiSpecification() {
        Map<String, Object> spec = new HashMap<>();
        spec.put("openapi", "3.0.3");

        Map<String, Object> info = new HashMap<>();
        info.put("title", "ShoppingFlow - E-Commerce Hub REST API");
        info.put("version", "1.0.0");
        info.put("description", "Production-grade RESTful APIs for shopping journeys, auth, cart, orders, and admin operations.");
        spec.put("info", info);

        spec.put("servers", List.of(Map.of("url", "http://localhost:8080", "description", "Local Development Server")));

        Map<String, Object> paths = new HashMap<>();

        // Auth endpoints
        paths.put("/api/auth/register", Map.of(
                "post", Map.of(
                        "summary", "Register new customer account",
                        "tags", List.of("Authentication"),
                        "responses", Map.of("201", Map.of("description", "Customer registered successfully"))
                )
        ));
        paths.put("/api/auth/login", Map.of(
                "post", Map.of(
                        "summary", "Authenticate user and get JWT token",
                        "tags", List.of("Authentication"),
                        "responses", Map.of("200", Map.of("description", "JWT Token returned"))
                )
        ));
        paths.put("/api/auth/me", Map.of(
                "get", Map.of(
                        "summary", "Get current user profile from JWT",
                        "tags", List.of("Authentication"),
                        "security", List.of(Map.of("bearerAuth", List.of()))
                )
        ));

        // Catalog endpoints
        paths.put("/api/categories", Map.of(
                "get", Map.of("summary", "List all active product categories", "tags", List.of("Categories"))
        ));
        paths.put("/api/products", Map.of(
                "get", Map.of(
                        "summary", "Search, filter, paginate and sort product catalog",
                        "tags", List.of("Products"),
                        "parameters", List.of(
                                Map.of("name", "keyword", "in", "query"),
                                Map.of("name", "categoryId", "in", "query"),
                                Map.of("name", "minPrice", "in", "query"),
                                Map.of("name", "maxPrice", "in", "query"),
                                Map.of("name", "page", "in", "query"),
                                Map.of("name", "size", "in", "query"),
                                Map.of("name", "sortBy", "in", "query")
                        )
                )
        ));
        paths.put("/api/products/featured", Map.of(
                "get", Map.of("summary", "Get top-rated featured products", "tags", List.of("Products"))
        ));
        paths.put("/api/products/{id}", Map.of(
                "get", Map.of("summary", "Get product details by ID", "tags", List.of("Products"))
        ));

        // Cart endpoints
        paths.put("/api/cart", Map.of(
                "get", Map.of("summary", "Get current customer's shopping cart", "tags", List.of("Cart")),
                "delete", Map.of("summary", "Clear shopping cart", "tags", List.of("Cart"))
        ));
        paths.put("/api/cart/items", Map.of(
                "post", Map.of("summary", "Add product to cart", "tags", List.of("Cart"))
        ));
        paths.put("/api/cart/items/{itemId}", Map.of(
                "put", Map.of("summary", "Update cart item quantity", "tags", List.of("Cart")),
                "delete", Map.of("summary", "Remove item from cart", "tags", List.of("Cart"))
        ));

        // Order endpoints
        paths.put("/api/orders/checkout", Map.of(
                "post", Map.of("summary", "Place order and deduct inventory", "tags", List.of("Orders"))
        ));
        paths.put("/api/orders", Map.of(
                "get", Map.of("summary", "List customer's order history", "tags", List.of("Orders"))
        ));
        paths.put("/api/orders/{orderNumber}", Map.of(
                "get", Map.of("summary", "Get order details and track journey", "tags", List.of("Orders"))
        ));
        paths.put("/api/orders/{orderNumber}/cancel", Map.of(
                "put", Map.of("summary", "Cancel order and restock products", "tags", List.of("Orders"))
        ));

        // Admin endpoints
        paths.put("/api/admin/metrics", Map.of(
                "get", Map.of("summary", "Platform KPI metrics (revenue, orders, inventory alerts)", "tags", List.of("Admin"))
        ));
        paths.put("/api/admin/products", Map.of(
                "post", Map.of("summary", "Create new product in catalog", "tags", List.of("Admin"))
        ));
        paths.put("/api/admin/products/{id}", Map.of(
                "put", Map.of("summary", "Update existing product", "tags", List.of("Admin")),
                "delete", Map.of("summary", "Deactivate product", "tags", List.of("Admin"))
        ));
        paths.put("/api/admin/orders", Map.of(
                "get", Map.of("summary", "List all platform customer orders", "tags", List.of("Admin"))
        ));
        paths.put("/api/admin/orders/{orderNumber}/status", Map.of(
                "put", Map.of("summary", "Update order delivery lifecycle status", "tags", List.of("Admin"))
        ));

        spec.put("paths", paths);
        return spec;
    }
}
