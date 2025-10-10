// models/Todo.js
import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  scheduledAt: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  userId: { type: String, required: true }, // store session.user.id
}, { timestamps: true });

export default mongoose.models.Todo || mongoose.model("Todo", TodoSchema);
