INSERT INTO categories (user_id, name, is_default)
VALUES
  (NULL, 'Food', TRUE),
  (NULL, 'Transport', TRUE),
  (NULL, 'Rent', TRUE),
  (NULL, 'Bills', TRUE),
  (NULL, 'Shopping', TRUE),
  (NULL, 'Health', TRUE),
  (NULL, 'Entertainment', TRUE),
  (NULL, 'Education', TRUE),
  (NULL, 'Other', TRUE)
ON CONFLICT DO NOTHING;
