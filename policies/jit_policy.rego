package jit

import future.keywords.if
import future.keywords.in

default decision := {
    "decision": "deny",
    "reason": "No policy rule matched this request.",
}

decision := result if {
    result := decide
}

decide := {
    "decision": "deny",
    "reason": "Requested duration exceeds the 8 hour hard ceiling.",
} if {
    input.duration_minutes > 480
}

decide := {
    "decision": "deny",
    "reason": "Justification must be at least 10 characters.",
} if {
    count(input.justification) < 10
    not exceeded_ceiling
}

decide := {
    "decision": "deny",
    "reason": "Production access cannot exceed 4 hours.",
} if {
    is_production_environment
    input.duration_minutes > 240
    not exceeded_ceiling
    not short_justification
}

decide := {
    "decision": "requires_approval",
    "reason": "Break glass access always requires approval from a Security Lead.",
} if {
    input.requested_role == "ECS-Prod-BreakGlass"
    not exceeded_ceiling
    not short_justification
    not production_too_long
}

decide := {
    "decision": "requires_approval",
    "reason": "Production database access requires manual approval.",
} if {
    input.environment == "production-db"
    not exceeded_ceiling
    not short_justification
    not production_too_long
}

decide := {
    "decision": "requires_approval",
    "reason": "Production write access requires manual approval.",
} if {
    input.environment == "production"
    not is_read_only_role
    not exceeded_ceiling
    not short_justification
    not production_too_long
}

decide := {
    "decision": "allow",
    "reason": "Staging and development requests under 2 hours are auto approved.",
} if {
    is_non_production_environment
    input.duration_minutes <= 120
    not exceeded_ceiling
    not short_justification
}

decide := {
    "decision": "requires_approval",
    "reason": "Non production requests over 2 hours require approval.",
} if {
    is_non_production_environment
    input.duration_minutes > 120
    not exceeded_ceiling
    not short_justification
}

# Helper predicates

exceeded_ceiling if {
    input.duration_minutes > 480
}

short_justification if {
    count(input.justification) < 10
}

production_too_long if {
    is_production_environment
    input.duration_minutes > 240
}

is_production_environment if {
    input.environment in ["production", "production-db"]
}

is_non_production_environment if {
    input.environment in ["development", "staging"]
}

is_read_only_role if {
    endswith(input.requested_role, "ReadOnly")
}

is_read_only_role if {
    input.requested_role == "DatabaseReader"
}