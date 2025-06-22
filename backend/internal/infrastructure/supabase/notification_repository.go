package supabase

import (
	"context"
	"fmt"
	"time"

	"goreal-backend/internal/domain"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

var notificationTracer = otel.Tracer("goreal-backend/infrastructure/supabase/notification")

type notificationRepository struct {
	client *Client
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(client *Client) domain.NotificationRepository {
	return &notificationRepository{
		client: client,
	}
}

// Create creates a new notification
func (r *notificationRepository) Create(ctx context.Context, notification *domain.Notification) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.Create")
	defer span.End()

	span.SetAttributes(
		attribute.String("notification.id", notification.ID.String()),
		attribute.String("notification.user_id", notification.UserID.String()),
		attribute.String("notification.type", string(notification.Type)),
		attribute.String("notification.title", notification.Title),
	)

	// Set timestamp
	notification.CreatedAt = time.Now()

	// Execute insert query
	err := r.client.ExecuteQuery(ctx, "insert", "notifications", func() error {
		return r.client.From("notifications").Insert(notification).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create notification: %w", err)
	}

	return nil
}

// GetByID retrieves a notification by ID
func (r *notificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Notification, error) {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.GetByID")
	defer span.End()

	span.SetAttributes(attribute.String("notification.id", id.String()))

	var notification domain.Notification
	err := r.client.ExecuteQuery(ctx, "select", "notifications", func() error {
		return r.client.From("notifications").
			Select("*").
			Eq("id", id).
			Single(ctx, &notification)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get notification by ID: %w", err)
	}

	return &notification, nil
}

// Update updates an existing notification
func (r *notificationRepository) Update(ctx context.Context, notification *domain.Notification) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.Update")
	defer span.End()

	span.SetAttributes(
		attribute.String("notification.id", notification.ID.String()),
		attribute.Bool("notification.is_read", notification.IsRead),
	)

	err := r.client.ExecuteQuery(ctx, "update", "notifications", func() error {
		return r.client.From("notifications").
			Update(notification).
			Eq("id", notification.ID).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to update notification: %w", err)
	}

	return nil
}

// Delete deletes a notification by ID
func (r *notificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.Delete")
	defer span.End()

	span.SetAttributes(attribute.String("notification.id", id.String()))

	err := r.client.ExecuteQuery(ctx, "delete", "notifications", func() error {
		return r.client.From("notifications").
			Delete().
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	return nil
}

// GetByUser retrieves notifications for a user
func (r *notificationRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*domain.Notification, error) {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.GetByUser")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	query := r.client.From("notifications").
		Select("*").
		Eq("user_id", userID).
		Order("created_at", false) // Most recent first

	var notifications []*domain.Notification
	err := r.client.ExecuteQuery(ctx, "select", "notifications", func() error {
		return query.Execute(ctx, &notifications)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get notifications by user ID: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(notifications)))

	return notifications, nil
}

// GetUnreadByUserID retrieves unread notifications for a user
func (r *notificationRepository) GetUnreadByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Notification, error) {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.GetUnreadByUserID")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	var notifications []*domain.Notification
	err := r.client.ExecuteQuery(ctx, "select", "notifications", func() error {
		return r.client.From("notifications").
			Select("*").
			Eq("user_id", userID).
			Eq("is_read", false).
			Order("created_at", false).
			Execute(ctx, &notifications)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get unread notifications: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(notifications)))

	return notifications, nil
}

// GetByType retrieves notifications by type for a user
func (r *notificationRepository) GetByType(ctx context.Context, userID uuid.UUID, notificationType domain.NotificationType) ([]*domain.Notification, error) {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.GetByType")
	defer span.End()

	span.SetAttributes(
		attribute.String("user.id", userID.String()),
		attribute.String("notification.type", string(notificationType)),
	)

	var notifications []*domain.Notification
	err := r.client.ExecuteQuery(ctx, "select", "notifications", func() error {
		return r.client.From("notifications").
			Select("*").
			Eq("user_id", userID).
			Eq("type", string(notificationType)).
			Order("created_at", false).
			Execute(ctx, &notifications)
	})

	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("failed to get notifications by type: %w", err)
	}

	span.SetAttributes(attribute.Int("result.count", len(notifications)))

	return notifications, nil
}

// MarkAsRead marks a notification as read
func (r *notificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.MarkAsRead")
	defer span.End()

	span.SetAttributes(attribute.String("notification.id", id.String()))

	updateData := map[string]interface{}{
		"is_read": true,
	}

	err := r.client.ExecuteQuery(ctx, "update", "notifications", func() error {
		return r.client.From("notifications").
			Update(updateData).
			Eq("id", id).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.MarkAllAsRead")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	updateData := map[string]interface{}{
		"is_read": true,
	}

	err := r.client.ExecuteQuery(ctx, "update", "notifications", func() error {
		return r.client.From("notifications").
			Update(updateData).
			Eq("user_id", userID).
			Eq("is_read", false).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}

	return nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *notificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.GetUnreadCount")
	defer span.End()

	span.SetAttributes(attribute.String("user.id", userID.String()))

	var notifications []*domain.Notification
	err := r.client.ExecuteQuery(ctx, "select", "notifications", func() error {
		return r.client.From("notifications").
			Select("id").
			Eq("user_id", userID).
			Eq("is_read", false).
			Execute(ctx, &notifications)
	})

	if err != nil {
		span.RecordError(err)
		return 0, fmt.Errorf("failed to get unread count: %w", err)
	}

	count := len(notifications)
	span.SetAttributes(attribute.Int("result.count", count))

	return count, nil
}

// DeleteOldNotifications deletes notifications older than the specified duration
func (r *notificationRepository) DeleteOldNotifications(ctx context.Context, olderThan time.Duration) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.DeleteOldNotifications")
	defer span.End()

	cutoffDate := time.Now().Add(-olderThan)
	span.SetAttributes(attribute.String("cutoff_date", cutoffDate.Format(time.RFC3339)))

	err := r.client.ExecuteQuery(ctx, "delete", "notifications", func() error {
		return r.client.From("notifications").
			Delete().
			Lt("created_at", cutoffDate.Format(time.RFC3339)).
			Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to delete old notifications: %w", err)
	}

	return nil
}

// CreateBulk creates multiple notifications
func (r *notificationRepository) CreateBulk(ctx context.Context, notifications []*domain.Notification) error {
	ctx, span := notificationTracer.Start(ctx, "notificationRepository.CreateBulk")
	defer span.End()

	span.SetAttributes(attribute.Int("notification.count", len(notifications)))

	// Set timestamps for all notifications
	now := time.Now()
	for _, notification := range notifications {
		notification.CreatedAt = now
	}

	err := r.client.ExecuteQuery(ctx, "insert", "notifications", func() error {
		return r.client.From("notifications").Insert(notifications).Execute(ctx, nil)
	})

	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to create bulk notifications: %w", err)
	}

	return nil
}
