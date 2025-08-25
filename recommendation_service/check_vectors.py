import numpy as np
import pickle

with open("book_vectors.pkl", "rb") as f:
    book_vectors = pickle.load(f)

print("Shape:", book_vectors.shape)

# Kiểm tra số phần tử khác 0 của 5 sách đầu
for i in range(5):
    non_zero = np.count_nonzero(book_vectors[i])
    print(f"Sách {i}: {non_zero} đặc trưng khác 0")

# Nếu muốn in các giá trị khác 0
i = 0  # sách đầu tiên
indices = np.where(book_vectors[i] != 0)[0]
print(f"\nVector sách {i} có {len(indices)} giá trị khác 0, ví dụ:")
print(indices[:20])  # in 20 chỉ số đặc trưng khác 0
print(book_vectors[i][indices[:20]])  # in giá trị tại đó
