package com.bank.api.config;

import com.bank.api.config.properties.AiConfigProperties;
import com.bank.api.config.properties.CorsConfigProperties;
import com.bank.api.config.properties.JwtConfigProperties;
import com.bank.api.config.properties.PqcConfigProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        AiConfigProperties.class,
        CorsConfigProperties.class,
        JwtConfigProperties.class,
        PqcConfigProperties.class
})
public class AppConfig {
}
