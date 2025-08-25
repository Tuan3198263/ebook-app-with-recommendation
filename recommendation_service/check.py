import pickle
import json

# --- Load similarity_matrix.pkl ---
with open("similarity_matrix.pkl", "rb") as f:
    similarity_matrix = pickle.load(f)

print("=== similarity_matrix.pkl ===")
print("Kiểu dữ liệu:", type(similarity_matrix))
if hasattr(similarity_matrix, "shape"):
    print("Kích thước ma trận:", similarity_matrix.shape)
    print("Ví dụ [0:5, 0:5]:\n", similarity_matrix[:5, :5])
else:
    print("Không phải numpy array, ví dụ:", str(similarity_matrix)[:500])
print()


# --- Load books_model_data.pkl ---
with open("books_model_data.pkl", "rb") as f:
    model_data_df = pickle.load(f)

print("=== books_model_data.pkl ===")
print("Kiểu dữ liệu:", type(model_data_df))

# Nếu là DataFrame
try:
    print("Số dòng:", len(model_data_df))
    print("Các cột:", model_data_df.columns.tolist())
    print("5 dòng đầu:\n", model_data_df.head())
except Exception as e:
    # Nếu không phải DataFrame (có thể là dict)
    print("Keys:", list(model_data_df.keys())[:10])
    first_key = list(model_data_df.keys())[0]
    print("Ví dụ một vector:", str(model_data_df[first_key])[:200])
print()


# --- Load objectid_to_index.json ---
with open("objectid_to_index.json", "r") as f:
    objectid_to_index = json.load(f)

print("=== objectid_to_index.json ===")
print("Số lượng:", len(objectid_to_index))
print("5 cặp đầu:", list(objectid_to_index.items())[:5])
print()


# --- Load index_to_objectid.json ---
with open("index_to_objectid.json", "r") as f:
    index_to_objectid = json.load(f)

print("=== index_to_objectid.json ===")
print("Số lượng:", len(index_to_objectid))
print("5 cặp đầu:", list(index_to_objectid.items())[:5])
print()


# --- Load faculty_mapping.json ---
with open("faculty_mapping.json", "r", encoding="utf-8") as f:
    faculty_mapping = json.load(f)

print("=== faculty_mapping.json ===")
print("Số khoa:", len(faculty_mapping))
print("Danh sách khoa:", list(faculty_mapping.keys()))
print("Ví dụ 1 khoa:", list(faculty_mapping.items())[:1])
