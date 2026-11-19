package com.ecommerce.config;

import com.ecommerce.entity.*;
import com.ecommerce.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           CartRepository cartRepository,
                           OrderRepository orderRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.cartRepository = cartRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Data already seeded
        }

        System.out.println(">>> Initializing E-Commerce Demo Data...");

        // 1. Create Users
        User admin = new User(
                "admin@store.com",
                passwordEncoder.encode("Admin@123"),
                "Alexander Wright (Admin)",
                "+1-555-0199",
                User.Role.ROLE_ADMIN
        );
        userRepository.save(admin);
        cartRepository.save(new Cart(admin));

        User customer = new User(
                "customer@store.com",
                passwordEncoder.encode("Customer@123"),
                "Sophia Chen",
                "+1-555-0144",
                User.Role.ROLE_CUSTOMER
        );
        userRepository.save(customer);
        Cart customerCart = cartRepository.save(new Cart(customer));

        // 2. Create Categories
        Category catElectronics = categoryRepository.save(new Category(
                "Electronics",
                "electronics",
                "Next-gen tech, laptops, smartphones, and smart devices.",
                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"
        ));

        Category catAudio = categoryRepository.save(new Category(
                "Audio & Accessories",
                "audio-accessories",
                "Audiophile-grade headphones, earbuds, and portable speakers.",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
        ));

        Category catFashion = categoryRepository.save(new Category(
                "Fashion & Apparel",
                "fashion-apparel",
                "Modern minimalistic wardrobe essentials crafted with premium materials.",
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
        ));

        Category catHome = categoryRepository.save(new Category(
                "Home & Living",
                "home-living",
                "Ergonomic furnishings and modern interior aesthetics.",
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
        ));

        Category catWearables = categoryRepository.save(new Category(
                "Wearables",
                "wearables",
                "Smartwatches, health fitness trackers, and smart eyewear.",
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
        ));

        // 3. Create Products
        List<Product> products = new ArrayList<>();

        products.add(new Product(
                "Aura Pro Wireless ANC Headphones",
                "aura-pro-wireless-anc-headphones",
                "Industry-leading active noise cancellation with 40-hour battery life, custom 40mm beryllium drivers, and ultra-plush memory foam cushions.",
                new BigDecimal("299.99"),
                45,
                "AUD-ANC-001",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                catAudio,
                4.9,
                142,
                true
        ));

        products.add(new Product(
                "Zenith Ultra Thin Laptop 15\"",
                "zenith-ultra-thin-laptop-15",
                "Powered by 12-core ARM architecture, 32GB unified memory, 1TB NVMe Gen4 SSD, and a breathtaking 3.2K 120Hz mini-LED display.",
                new BigDecimal("1499.00"),
                18,
                "LAP-ZEN-015",
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
                catElectronics,
                4.8,
                89,
                true
        ));

        products.add(new Product(
                "Apex Titan Chrono Smartwatch",
                "apex-titan-chrono-smartwatch",
                "Aerospace-grade titanium chassis with sapphire crystal face, dual-frequency GPS, ECG monitor, and 14-day battery reserve.",
                new BigDecimal("349.50"),
                32,
                "WRB-APX-007",
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                catWearables,
                4.7,
                64,
                true
        ));

        products.add(new Product(
                "ErgoFlow Mesh Task Chair",
                "ergoflow-mesh-task-chair",
                "Biomechanical posture support with dynamic 4D armrests, breathable elastomeric mesh, and synchronous tilt mechanism.",
                new BigDecimal("420.00"),
                12,
                "HOM-ERG-101",
                "https://images.unsplash.com/photo-1580481077195-c228c3b74b35?auto=format&fit=crop&w=800&q=80",
                catHome,
                4.9,
                210,
                true
        ));

        products.add(new Product(
                "Nordic Minimalist Wool Overcoat",
                "nordic-minimalist-wool-overcoat",
                "Tailored from 100% sustainably sourced Scandinavian virgin wool. Wind-resistant, double-breasted elegance.",
                new BigDecimal("280.00"),
                24,
                "FSH-COA-092",
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
                catFashion,
                4.6,
                38,
                false
        ));

        products.add(new Product(
                "SonicWave 360 Waterproof Speaker",
                "sonicwave-360-waterproof-speaker",
                "IP67 waterproof and dustproof rugged bluetooth speaker with 360-degree spatial acoustic dispersion and 24-hour party playtime.",
                new BigDecimal("119.00"),
                60,
                "AUD-SPK-033",
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
                catAudio,
                4.8,
                95,
                false
        ));

        products.add(new Product(
                "Horizon 4K OLED Curved Gaming Monitor",
                "horizon-4k-oled-curved-gaming-monitor",
                "34-inch ultrawide 1800R curved OLED panel featuring 175Hz refresh rate, 0.03ms GtG response time, and 99.3% DCI-P3 coverage.",
                new BigDecimal("899.99"),
                8,
                "MON-HRZ-034",
                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
                catElectronics,
                4.9,
                112,
                true
        ));

        products.add(new Product(
                "Artisan Japanese Selvedge Denim",
                "artisan-japanese-selvedge-denim",
                "14oz shuttle-loomed Kurabo raw selvedge denim with copper hardware, rope-dyed indigo, and classic tapered cut.",
                new BigDecimal("185.00"),
                28,
                "FSH-JNS-404",
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
                catFashion,
                4.7,
                47,
                false
        ));

        products.add(new Product(
                "Minimalist Solid Walnut Desk",
                "minimalist-solid-walnut-desk",
                "Handcrafted from North American black walnut with hidden cable routing management channel and bevelled edge profile.",
                new BigDecimal("650.00"),
                6,
                "HOM-DSK-055",
                "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
                catHome,
                4.9,
                53,
                true
        ));

        products.add(new Product(
                "Pulse Fit GPS Fitness Band",
                "pulse-fit-gps-fitness-band",
                "Continuous heart rate monitor, SpO2 blood oxygen sensor, 5ATM water resistance, and automatic workout detection.",
                new BigDecimal("79.99"),
                85,
                "WRB-PLS-020",
                "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
                catWearables,
                4.5,
                78,
                false
        ));

        products.add(new Product(
                "Ceramic Dripper & Pour-Over Coffee Station",
                "ceramic-dripper-coffee-station",
                "Handmade matte stoneware dripper with brass stand, double-walled borosilicate glass carafe, and micro-mesh steel filter.",
                new BigDecimal("88.00"),
                34,
                "HOM-COF-012",
                "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80",
                catHome,
                4.8,
                119,
                false
        ));

        products.add(new Product(
                "Leather Weekend Duffle Bag",
                "leather-weekend-duffle-bag",
                "Full-grain vegetable-tanned Italian leather with YKK Excella brass zippers, detachable shoulder strap, and waterproof shoe compartment.",
                new BigDecimal("240.00"),
                19,
                "FSH-BAG-772",
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
                catFashion,
                4.8,
                92,
                true
        ));

        productRepository.saveAll(products);

        // 4. Create an Initial Sample Order for customer
        Product p1 = products.get(0);
        Product p2 = products.get(2);

        BigDecimal sub = p1.getPrice().add(p2.getPrice());
        BigDecimal tax = sub.multiply(BigDecimal.valueOf(0.08)).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = sub.add(tax);

        Order initialOrder = new Order(
                "ORD-20261119-DEMO1",
                customer,
                sub,
                BigDecimal.ZERO,
                tax,
                total,
                "CREDIT_CARD",
                "742 Evergreen Terrace, Springfield, OR 97477, USA"
        );
        initialOrder.setStatus(Order.OrderStatus.PROCESSING);
        initialOrder.setPaymentStatus(Order.PaymentStatus.COMPLETED);

        OrderItem oi1 = new OrderItem(initialOrder, p1, p1.getName(), p1.getImageUrl(), 1, p1.getPrice());
        OrderItem oi2 = new OrderItem(initialOrder, p2, p2.getName(), p2.getImageUrl(), 1, p2.getPrice());
        initialOrder.getItems().add(oi1);
        initialOrder.getItems().add(oi2);

        orderRepository.save(initialOrder);

        System.out.println(">>> Demo Data Initialized Successfully!");
        System.out.println("    Admin: admin@store.com / Admin@123");
        System.out.println("    Customer: customer@store.com / Customer@123");
    }
}
