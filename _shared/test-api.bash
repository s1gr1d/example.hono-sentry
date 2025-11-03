BASE_URL="http://localhost:3000"

# --- Basic API Tests ---

echo "Testing Basic API endpoints..."

echo -e "\n1. Testing GET /"
curl -X GET "$BASE_URL/" -w "\nStatus: %{http_code}\n"

echo -e "\n2. Testing GET /error"
curl -X GET "$BASE_URL/error" -w "\nStatus: %{http_code}\n"

echo -e "\n3. Testing GET /error/network-timeout"
curl -X GET "$BASE_URL/error/network-timeout" -w "\nStatus: %{http_code}\n"

# --- Posts API Tests ---

echo -e "\n\nTesting Posts API endpoints..."

echo -e "\n4. Testing GET /posts-api/posts"
curl -X GET "$BASE_URL/posts-api/posts" -H "Content-Type: application/json" -w "\nStatus: %{http_code}\n"

echo -e "\n5. Testing GET /posts-api/posts/1"
curl -X GET "$BASE_URL/posts-api/posts/1" -H "Content-Type: application/json" -w "\nStatus: %{http_code}\n"

echo -e "\n6. Testing GET /posts-api/posts/999"
curl -X GET "$BASE_URL/posts-api/posts/999" -H "Content-Type: application/json" -w "\nStatus: %{http_code}\n"

echo -e "\n\nAPI testing complete!"
