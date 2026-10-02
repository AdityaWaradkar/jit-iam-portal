package jit

# Placeholder policy. Real logic implemented in Section 8.
default allow := false

allow if {
    input.demo_mode == true
}