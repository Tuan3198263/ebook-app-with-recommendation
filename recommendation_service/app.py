from flask import Flask, request, jsonify
import pickle, json
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load mô hình và dữ liệu
with open("similarity_matrix.pkl", "rb") as f:
    similarity_matrix = pickle.load(f)

with open("books_model_data.pkl", "rb") as f:
    model_data_df = pickle.load(f)

with open("objectid_to_index.json", "r") as f:
    objectid_to_index = json.load(f)

with open("index_to_objectid.json", "r") as f:
    index_to_objectid = json.load(f)

with open("faculty_mapping.json", "r", encoding="utf-8") as f:
    faculty_mapping = json.load(f)

print("[DEBUG] COLUMNS:", model_data_df.columns.tolist())

@app.route("/")
def home():
    return "📚 Recommendation Flask API is running!"

@app.route("/recommend", methods=["POST"])
def recommend_books():
    data = request.get_json()
    book_ids = data.get("book_ids", [])        # 👈 Nhiều book_id
    faculty_code = data.get("faculty")         # 👈 faculty_code
    top_k = int(data.get("top_k", 5))
    recommendations = []

    # === 📘 Trường hợp 1: Có nhiều book_id hợp lệ ===
    valid_indices = [int(objectid_to_index[b]) for b in book_ids if b in objectid_to_index]

    if valid_indices:
        # Gộp các vector similarity và trung bình
        user_profile = np.mean([similarity_matrix[i] for i in valid_indices], axis=0)
        sim_scores = list(enumerate(user_profile))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        for i, score in sim_scores:
            similar_book_id = index_to_objectid.get(str(i))
            if similar_book_id in book_ids:  # 👈 bỏ sách đã đọc
                continue
            matched_books = model_data_df[model_data_df["book_id"] == similar_book_id]
            if matched_books.empty:
                continue
            book_row = matched_books.iloc[0]
            recommendations.append({
                "book_id": similar_book_id,
                "title": book_row["book_title"],
                "category": book_row["book_category"],
                "score": round(float(score), 4)
            })
            if len(recommendations) >= top_k:
                break
        return jsonify(recommendations)

    # === 🧠 Trường hợp 2: Cold-start theo faculty ===
    elif faculty_code and faculty_code in faculty_mapping:
        category_name = faculty_mapping[faculty_code]
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

    # === ❌ Không có gì để gợi ý ===
    return jsonify({"error": "Invalid or missing book_ids or faculty"}), 400


if __name__ == "__main__":
    app.run(port=5001, debug=True)
