# Design — json-patch-core

Clone-then-apply: the caller's document is never touched, so a failed
patch leaves no partial state behind. Pointers resolve step by step;
arrays accept only canonical indices (no `-1`, no leading zeros) plus
trailing `-` on `add`.

Oracle: RFC 6902 appendix A cases, escape sequences, append, root
replace, immutability of the input, and one error per code with the
failing op index. `move`/`copy` deliberately excluded (composable from
get+remove+add by the caller).
