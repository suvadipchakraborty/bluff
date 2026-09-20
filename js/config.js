/* ThagaShield — Configuration
   Everything a maintainer might want to change lives here. No other code edits needed
   when researchers add scams or questions: they only edit the two Google Sheets. */
window.THAGA_CONFIG = {
  // Published-to-web CSV links of the two Google Sheets
  LEAF_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRislz9vHv7Zywivkzyij1hRFdrCMicMvhEWS33ga8ElljWNB822FOjFdNrRa9STwkrznrK9g0xXjkQ/pub?output=csv",
  TREE_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRm65O-VtVDcZKlFHphtda4Xikt_tpyzSdR520CkS3e7UNrhIxnN9tENzd1yrSMEL5-eHWOVISdOC0_/pub?output=csv",

  // node_id of the first question in the Decision Tree sheet
  START_NODE: "Q1_START",

  // What to do if the same node_id appears on more than one row of the Decision Tree sheet:
  //   "last"  -> the lowest row wins (default; later rows override earlier ones)
  //   "first" -> the highest row wins
  //   "merge" -> options from all duplicate rows are combined into one question
  // Duplicates are always listed under "Data health" in the Database tab.
  DUPLICATE_NODES: "last",

  FETCH_TIMEOUT_MS: 8000,          // give up on the live sheet after this long
  CACHE_KEY: "thagashield_data_v2",// last good copy of the sheets (localStorage)
  MAX_DEPTH: 12,                   // safety stop against looping trees

  // Confirmation stage: how the final confidence % is built
  CONFIRM: {
    WEIGHT_PATH: 30,     // reaching the scam through the decision tree
    WEIGHT_SIGNS: 50,    // red-flag ("signs") confirmations
    WEIGHT_KEYWORDS: 20, // trigger words the person recognised
    KEYWORD_HITS_FULL: 2,// this many recognised keywords earns the full keyword weight
    STRONG: 75,          // >= this and >= 2 red flags confirmed -> "Strong match"
    POSSIBLE: 50         // >= this -> "Possible match", below -> "Weak match"
  }
};
