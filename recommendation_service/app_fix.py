from flask import Flask, request, jsonify
import pickle, json
import numpy as np
import pandas as pd
from numpy.linalg import norm

app = Flask(__name__)

# === Load dữ liệu ===
with open("books_model_data.pkl", "rb") as f:
    model_data_df = pickle.load(f)

with open("objectid_to_index.json", "r") as f:
    objectid_to_index = json.load(f)

with open("index_to_objectid.json", "r") as f:
    index_to_objectid = json.load(f)

with open("faculty_mapping.json", "r", encoding="utf-8") as f:
    faculty_mapping = json.load(f)

with open("book_vectors.pkl", "rb") as f:   # 👈 vector đặc trưng TF-IDF + one-hot
    book_vectors = pickle.load(f)         # numpy array (n_books, n_features)

print("[DEBUG] Book vector shape:", book_vectors.shape)
print("[DEBUG] Columns in model_data_df:", model_data_df.columns.tolist())


def cosine_sim(a, b):
    """Tính cosine similarity giữa 2 vector"""
    if norm(a) == 0 or norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (norm(a) * norm(b)))


@app.route("/")
def home():
    return "📚 Recommendation Flask API is running!"


@app.route("/recommend", methods=["POST"])
def recommend_books():
    data = request.get_json()
    book_ids = data.get("book_ids", [])        # 📘 danh sách sách user đã đọc
    faculty_code = data.get("faculty")         # 🏫 khoa/ngành học
    top_k = int(data.get("top_k", 5))
    recommendations = []

    # === Trường hợp 1: Có danh sách sách đã đọc ===
    valid_indices = [int(objectid_to_index[b]) for b in book_ids if b in objectid_to_index]

    if valid_indices:
        print("[DEBUG] Valid indices:", valid_indices)

        # 📘 Tính user profile = trung bình vector sách đã đọc
        user_profile = np.mean([book_vectors[i] for i in valid_indices], axis=0)

    # ✅ Chuẩn hóa L2 user profile
        if norm(user_profile) > 0:
            user_profile = user_profile / norm(user_profile)

        print("[DEBUG] User profile vector (sample, L2 normalized):", user_profile[:10])



        print("[DEBUG] User profile vector (sample):", user_profile[:10])

        # 🧮 Tính cosine similarity giữa user_profile và từng sách
        sim_scores = []
        for i in range(len(book_vectors)):
            score = cosine_sim(user_profile, book_vectors[i])
            sim_scores.append((i, score))

        # 🔽 Sắp xếp theo độ tương tự giảm dần
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        for i, score in sim_scores:
            similar_book_id = index_to_objectid.get(str(i))
            if similar_book_id in book_ids:  # ❌ bỏ sách đã đọc
                continue
            matched_books = model_data_df[model_data_df["book_id"] == similar_book_id]
            if matched_books.empty:
                continue
            book_row = matched_books.iloc[0]
            recommendations.append({
                "book_id": similar_book_id,
                "title": book_row["book_title"],
                "category": book_row["book_category"],
                "score": round(score, 4)
            })
            if len(recommendations) >= top_k:
                break

        return jsonify(recommendations)

    # === Trường hợp 2: Cold-start theo faculty ===
    elif faculty_code and faculty_code in faculty_mapping:
        category_name = faculty_mapping[faculty_code]
        print("[DEBUG] Cold-start mode, faculty:", faculty_code, "->", category_name)

        filtered_books = model_data_df[model_data_df["book_category"] == category_name]
        if len(filtered_books) == 0:
            return jsonify({"error": f"No books found for category: {category_name}"}), 404

        unique_books = filtered_books.drop_duplicates(subset="book_id")
        sampled_books = unique_books.sample(n=min(top_k, len(unique_books)))
        for _, row in sampled_books.iterrows():
            recommendations.append({
                "book_id": row["book_id"],
                "title": row["book_title"],
                "category": row["book_category"],
                "score": None
            })
        return jsonify(recommendations)

    # ❌ Không có gì để gợi ý
    return jsonify({"error": "Invalid or missing book_ids or faculty"}), 400


if __name__ == "__main__":
    app.run(port=5001, debug=True)
