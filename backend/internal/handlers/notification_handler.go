package handlers

import (
	"net/http"
	"strings"

	"goreal-backend/internal/domain"
	"goreal-backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var notificationTracer = otel.Tracer("goreal-backend/handlers/notification")

// NotificationHandler handles notification-related HTTP requests
type NotificationHandler struct {
	notificationService domain.NotificationService
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(notificationService domain.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// RegisterRoutes registers notification routes
func (h *NotificationHandler) RegisterRoutes(router *gin.RouterGroup) {
	notifications := router.Group("/notifications")
	{
		notifications.GET("", h.GetUserNotifications)
		notifications.POST("", h.CreateNotification)
		notifications.PUT("/:id/read", h.MarkAsRead)
		notifications.PUT("/read-all", h.MarkAllAsRead)
		notifications.GET("/unread-count", h.GetUnreadCount)
		notifications.POST("/bulk", h.SendBulkNotification)
		notifications.POST("/email", h.SendEmailNotification)
		notifications.POST("/push", h.SendPushNotification)
	}
}

// GetUserNotifications retrieves notifications for the current user
func (h *NotificationHandler) GetUserNotifications(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.GetUserNotifications")
	defer span.End()

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	notifications, err := h.notificationService.GetByUser(ctx, user.ID)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve notifications",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.Int("notifications.count", len(notifications)),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": notifications,
	})
}

// CreateNotification creates a new notification
func (h *NotificationHandler) CreateNotification(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.CreateNotification")
	defer span.End()

	var req domain.CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	notification, err := h.notificationService.Create(ctx, &req)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create notification",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("notification.id", notification.ID.String()),
		attribute.String("notification.type", string(notification.Type)),
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Notification created successfully",
		"data": notification,
	})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.MarkAsRead")
	defer span.End()

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid notification ID",
		})
		return
	}

	if err := h.notificationService.MarkAsRead(ctx, id); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to mark notification as read",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("notification.id", id.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "Notification marked as read",
	})
}

// MarkAllAsRead marks all notifications as read for the current user
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.MarkAllAsRead")
	defer span.End()

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	if err := h.notificationService.MarkAllAsRead(ctx, user.ID); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to mark all notifications as read",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(attribute.String("user.id", user.ID.String()))

	c.JSON(http.StatusOK, gin.H{
		"message": "All notifications marked as read",
	})
}

// GetUnreadCount gets the count of unread notifications for the current user
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.GetUnreadCount")
	defer span.End()

	// Get current user from context
	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	count, err := h.notificationService.GetUnreadCount(ctx, user.ID)
	if err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get unread count",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("user.id", user.ID.String()),
		attribute.Int("unread.count", count),
	)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"unread_count": count,
		},
	})
}

// SendBulkNotification sends notifications to multiple users
func (h *NotificationHandler) SendBulkNotification(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.SendBulkNotification")
	defer span.End()

	var req domain.BulkNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.notificationService.SendBulkNotification(ctx, &req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send bulk notification",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.Int("recipients.count", len(req.UserIDs)),
		attribute.String("notification.type", string(req.Type)),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Bulk notification sent successfully",
		"recipients": len(req.UserIDs),
	})
}

// SendEmailNotification sends an email notification
func (h *NotificationHandler) SendEmailNotification(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.SendEmailNotification")
	defer span.End()

	var req domain.EmailNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.notificationService.SendEmailNotification(ctx, &req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send email notification",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("email.to", strings.Join(req.To, ",")),
		attribute.String("email.subject", req.Subject),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Email notification sent successfully",
	})
}

// SendPushNotification sends a push notification
func (h *NotificationHandler) SendPushNotification(c *gin.Context) {
	ctx, span := notificationTracer.Start(c.Request.Context(), "notificationHandler.SendPushNotification")
	defer span.End()

	var req domain.PushNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if err := h.notificationService.SendPushNotification(ctx, &req); err != nil {
		span.RecordError(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send push notification",
			"details": err.Error(),
		})
		return
	}

	span.SetAttributes(
		attribute.String("push.title", req.Title),
		attribute.String("push.body", req.Body),
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Push notification sent successfully",
	})
}
