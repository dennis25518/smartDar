-- Migration 15: Allow users to update their own alerts (to mark them resolved)

CREATE POLICY "Users can update alerts from their own sensors"
  ON alerts FOR UPDATE
  USING (
    sensor_id IN (
      SELECT id FROM sensors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    sensor_id IN (
      SELECT id FROM sensors WHERE user_id = auth.uid()
    )
  );
