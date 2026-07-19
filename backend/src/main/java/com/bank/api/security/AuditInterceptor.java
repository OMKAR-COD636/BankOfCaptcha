package com.bank.api.security;

import com.bank.api.service.PqcAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

@Component
public class AuditInterceptor implements HandlerInterceptor {
    private final PqcAuditService pqcAuditService;

    public AuditInterceptor(PqcAuditService pqcAuditService) {
        this.pqcAuditService = pqcAuditService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String role = auth.getAuthorities().iterator().next().getAuthority();
            String uri = request.getRequestURI().replaceAll("/\\d+", "/{id}");
            String action = request.getMethod() + " " + uri;
            pqcAuditService.record(auth.getName(), action, LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS));
        }
        return true;
    }
}
