#!/bin/bash

BASE_URL="http://localhost:8787"

# Check if server is running
check_server() {
    if ! curl -s "$BASE_URL/" > /dev/null 2>&1; then
        echo "Server is not running on $BASE_URL. Start the server and try again."
        exit 1
    fi
}

# Test API concurrency
test_api() {
    local num_requests=100
    echo "Hitting API endpoint $num_requests times..."

    local passed=0
    local failed=0
    local temp_dir=$(mktemp -d)

    # Send all requests concurrently
    for i in $(seq 1 $num_requests); do
        (
            user_id="user_$i"
            response=$(curl -s -X POST "$BASE_URL/test-async-context/test/api-simulation" \
                -H "Content-Type: application/json" \
                -d "{\"userId\":\"$user_id\"}")

            if echo "$response" | grep -q "\"userId\":\"$user_id\"" && echo "$response" | grep -q "\"isIsolated\":true"; then
                echo "1" > "$temp_dir/success_$i"
            else
                echo "$user_id: FAILED - $response" > "$temp_dir/failed_$i"
            fi
        ) &
    done

    # Wait for all requests
    wait

    # Count results
    passed=$(ls "$temp_dir"/success_* 2>/dev/null | wc -l)
    failed=$(ls "$temp_dir"/failed_* 2>/dev/null | wc -l)

    # Show failed requests
    if [ $failed -gt 0 ]; then
        echo -e "\nFailed Requests:"
        for f in "$temp_dir"/failed_*; do
            [ -f "$f" ] && echo "   $(cat "$f")"
        done
    fi

    echo -e "\nResults:"
    echo "   Passed: $passed"
    echo "   Failed: $failed"

    # Cleanup
    rm -rf "$temp_dir"
}

# Main execution
main() {
    echo "Starting async context isolation tests..."
    check_server
    echo "Server is running"
    echo ""

    test_api
}

main "$@"
