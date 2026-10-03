# First Results Report — GOAT Model v0.2

Data freeze: 2026-08-15. No player was forced into any rank. The final order is produced only after multi-source fact reconciliation, a source-weighted public prior, repeated out-of-fold model fitting and posterior fusion.

## 1. Candidate Pool

The union contains 300 players: Pool A 203, Pool B 219, Pool C 162.

## 2. Data correction that changed the GOAT diagnosis

v0.1 combined partial historical playoff sources as if they were comparable career totals: Jordan had only 30 known playoff wins, Kareem was NA, and LeBron had 182. v0.2 rebuilds every retained playoff season from game boxes. The corrected career totals are Jordan 179 games/119 wins, Kareem 237/154 and LeBron 287/183. This reduces—but does not erase—the data-only longevity advantage.

| player_name | posterior_rank | posterior_score | public_prior_rank | public_prior_score | model_evidence_score | prior_weight | regular_season_score | peak_score | longevity_score | playoffs_score | awards_score | defense_score | team_success_score | human_rank | human_score | v0_1_human_rank | v0_1_human_score | playoff_games | playoff_wins_known | playoff_ppg | playoff_ts_pct | human_score_change_vs_v0_1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Michael Jordan | 1 | 97.650 | 1.000 | 100.000 | 90.487 | 0.753 | 85.640 | 97.667 | 88.787 | 94.475 | 98.822 | 90.144 | 96.300 | 3 | 93.225 | 3 | 91.241 | 179.000 | 119.000 | 33.447 | 0.568 | 1.984 |
| LeBron James | 2 | 97.205 | 2.000 | 98.561 | 93.084 | 0.753 | 91.480 | 99.378 | 97.720 | 98.231 | 98.243 | 81.103 | 94.942 | 1 | 95.334 | 1 | 95.576 | 287.000 | 183.000 | 28.439 | 0.587 | -0.242 |
| Kareem Abdul-Jabbar | 3 | 95.273 | 3.000 | 96.144 | 92.876 | 0.734 | 88.300 | 99.157 | 98.550 | 94.323 | 98.872 | 83.843 | 98.517 | 2 | 94.842 | 2 | 94.230 | 237.000 | 154.000 | 24.312 | 0.568 | 0.612 |

The transparent Human model still ranks LeBron first and Kareem second because longevity and cumulative regular/playoff volume remain deliberately important. Jordan's Human deficit versus LeBron falls from 4.335 points in v0.1 to 2.110 in v0.2 after the playoff repair.

## 3. Public prior

All four retained ordered lists independently rank Michael Jordan #1. The reliability-weighted prior is Jordan 100.000, LeBron 98.561 and Kareem 96.144. The official NBA 50/75 lists are not given fake ranks.

## 4. Fitted model and posterior

The constrained model's repeated-OOF RMSE is 12.972. Its evidence alone favors LeBron (93.084), Kareem (92.876), then Jordan (90.487). The base posterior gives the four-source prior about 75% weight for Jordan/LeBron and produces Jordan 97.650, LeBron 97.205, Kareem 95.273.

## 5. Sensitivity is run after the posterior

| scenario | source_changed | multiplier | player_name | posterior_score |
| --- | --- | --- | --- | --- |
| Configured source weights | NONE | 1.000 | Michael Jordan | 97.650 |
| Equal source weights | ALL | 1.000 | Michael Jordan | 97.855 |
| Leave-one-source-out | Bleacher_Report_2025 | 0.000 | Michael Jordan | 97.206 |
| Leave-one-source-out | CBS_2017 | 0.000 | Michael Jordan | 97.133 |
| Leave-one-source-out | ESPN_2022 | 0.000 | Michael Jordan | 97.017 |
| Leave-one-source-out | HoopsHype_2021 | 0.000 | Michael Jordan | 97.057 |
| Prior precision multiplier | ALL | 0.000 | LeBron James | 93.084 |
| Prior precision multiplier | ALL | 0.500 | LeBron James | 96.388 |
| Prior precision multiplier | ALL | 1.000 | Michael Jordan | 97.650 |
| Prior precision multiplier | ALL | 1.500 | Michael Jordan | 98.293 |
| Prior precision multiplier | ALL | 2.000 | Michael Jordan | 98.573 |
| Single-source reliability perturbation | Bleacher_Report_2025 | 0.750 | Michael Jordan | 97.553 |
| Single-source reliability perturbation | Bleacher_Report_2025 | 1.250 | Michael Jordan | 97.740 |
| Single-source reliability perturbation | CBS_2017 | 0.750 | Michael Jordan | 97.539 |
| Single-source reliability perturbation | CBS_2017 | 1.250 | Michael Jordan | 97.751 |
| Single-source reliability perturbation | ESPN_2022 | 0.750 | Michael Jordan | 97.518 |
| Single-source reliability perturbation | ESPN_2022 | 1.250 | Michael Jordan | 97.768 |
| Single-source reliability perturbation | HoopsHype_2021 | 0.750 | Michael Jordan | 97.525 |
| Single-source reliability perturbation | HoopsHype_2021 | 1.250 | Michael Jordan | 97.763 |

Jordan stays #1 when any one ordered source is removed, when all sources are equally weighted, and in 1000 random reasonable source-reliability draws (estimated P[#1] = 100.0%). If the total prior precision is cut to 50% of the configured value, LeBron becomes #1; at the configured precision Jordan is #1. The conclusion is therefore robust to *relative source weighting* but not to declaring public consensus only half as informative as configured.

Across the configured Peak/Longevity/Playoff/Defense/MVP/Championship sensitivity grid, the public-prior-anchored user-value model keeps Jordan #1. In the wider Make Him GOAT search, LeBron can reach #1 with an L2 weight change of about 0.200 from the default user weights; Kareem was not found at #1 in the finite anchored search.

## 6. Final posterior ranking

### Prior + Model Posterior Top 10

| Rank | Player | Score |
| --- | --- | --- |
| 1 | Michael Jordan | 97.650 |
| 2 | LeBron James | 97.205 |
| 3 | Kareem Abdul-Jabbar | 95.273 |
| 4 | Magic Johnson | 93.122 |
| 5 | Wilt Chamberlain | 90.914 |
| 6 | Larry Bird | 87.961 |
| 7 | Tim Duncan | 87.649 |
| 8 | Shaquille O'Neal | 86.956 |
| 9 | Kobe Bryant | 85.821 |
| 10 | Bill Russell | 84.904 |

### Prior + Model Posterior Top 25

| Rank | Player | Score |
| --- | --- | --- |
| 1 | Michael Jordan | 97.650 |
| 2 | LeBron James | 97.205 |
| 3 | Kareem Abdul-Jabbar | 95.273 |
| 4 | Magic Johnson | 93.122 |
| 5 | Wilt Chamberlain | 90.914 |
| 6 | Larry Bird | 87.961 |
| 7 | Tim Duncan | 87.649 |
| 8 | Shaquille O'Neal | 86.956 |
| 9 | Kobe Bryant | 85.821 |
| 10 | Bill Russell | 84.904 |
| 11 | Hakeem Olajuwon | 83.633 |
| 12 | Kevin Durant | 81.590 |
| 13 | Stephen Curry | 78.954 |
| 14 | Nikola Jokić | 78.695 |
| 15 | Oscar Robertson | 78.438 |
| 16 | Moses Malone | 75.750 |
| 17 | Jerry West | 75.380 |
| 18 | Kevin Garnett | 73.868 |
| 19 | Giannis Antetokounmpo | 73.628 |
| 20 | Dirk Nowitzki | 73.251 |
| 21 | Karl Malone | 73.059 |
| 22 | Julius Erving | 69.068 |
| 23 | David Robinson | 68.000 |
| 24 | Charles Barkley | 67.062 |
| 25 | Dwyane Wade | 63.955 |

### Prior + Model Posterior Top 50

| Rank | Player | Score |
| --- | --- | --- |
| 1 | Michael Jordan | 97.650 |
| 2 | LeBron James | 97.205 |
| 3 | Kareem Abdul-Jabbar | 95.273 |
| 4 | Magic Johnson | 93.122 |
| 5 | Wilt Chamberlain | 90.914 |
| 6 | Larry Bird | 87.961 |
| 7 | Tim Duncan | 87.649 |
| 8 | Shaquille O'Neal | 86.956 |
| 9 | Kobe Bryant | 85.821 |
| 10 | Bill Russell | 84.904 |
| 11 | Hakeem Olajuwon | 83.633 |
| 12 | Kevin Durant | 81.590 |
| 13 | Stephen Curry | 78.954 |
| 14 | Nikola Jokić | 78.695 |
| 15 | Oscar Robertson | 78.438 |
| 16 | Moses Malone | 75.750 |
| 17 | Jerry West | 75.380 |
| 18 | Kevin Garnett | 73.868 |
| 19 | Giannis Antetokounmpo | 73.628 |
| 20 | Dirk Nowitzki | 73.251 |
| 21 | Karl Malone | 73.059 |
| 22 | Julius Erving | 69.068 |
| 23 | David Robinson | 68.000 |
| 24 | Charles Barkley | 67.062 |
| 25 | Dwyane Wade | 63.955 |
| 26 | Kawhi Leonard | 61.346 |
| 27 | Chris Paul | 60.562 |
| 28 | James Harden | 59.093 |
| 29 | Elgin Baylor | 58.969 |
| 30 | Scottie Pippen | 58.852 |
| 31 | Bob Pettit | 57.009 |
| 32 | John Stockton | 55.613 |
| 33 | John Havlicek | 54.019 |
| 34 | Bob Cousy | 53.273 |
| 35 | Allen Iverson | 51.081 |
| 36 | Steve Nash | 50.325 |
| 37 | Isiah Thomas | 49.235 |
| 38 | Anthony Davis | 47.828 |
| 39 | Shai Gilgeous-Alexander | 47.772 |
| 40 | Russell Westbrook | 47.761 |
| 41 | Jason Kidd | 47.406 |
| 42 | Dwight Howard | 46.384 |
| 43 | Patrick Ewing | 44.548 |
| 44 | Clyde Drexler | 44.409 |
| 45 | Rick Barry | 44.099 |
| 46 | Luka Dončić | 42.740 |
| 47 | Joel Embiid | 42.109 |
| 48 | Gary Payton | 41.206 |
| 49 | Walt Frazier | 40.463 |
| 50 | Bob McAdoo | 40.234 |

### Prior + Model Posterior Top 100

| Rank | Player | Score |
| --- | --- | --- |
| 1 | Michael Jordan | 97.650 |
| 2 | LeBron James | 97.205 |
| 3 | Kareem Abdul-Jabbar | 95.273 |
| 4 | Magic Johnson | 93.122 |
| 5 | Wilt Chamberlain | 90.914 |
| 6 | Larry Bird | 87.961 |
| 7 | Tim Duncan | 87.649 |
| 8 | Shaquille O'Neal | 86.956 |
| 9 | Kobe Bryant | 85.821 |
| 10 | Bill Russell | 84.904 |
| 11 | Hakeem Olajuwon | 83.633 |
| 12 | Kevin Durant | 81.590 |
| 13 | Stephen Curry | 78.954 |
| 14 | Nikola Jokić | 78.695 |
| 15 | Oscar Robertson | 78.438 |
| 16 | Moses Malone | 75.750 |
| 17 | Jerry West | 75.380 |
| 18 | Kevin Garnett | 73.868 |
| 19 | Giannis Antetokounmpo | 73.628 |
| 20 | Dirk Nowitzki | 73.251 |
| 21 | Karl Malone | 73.059 |
| 22 | Julius Erving | 69.068 |
| 23 | David Robinson | 68.000 |
| 24 | Charles Barkley | 67.062 |
| 25 | Dwyane Wade | 63.955 |
| 26 | Kawhi Leonard | 61.346 |
| 27 | Chris Paul | 60.562 |
| 28 | James Harden | 59.093 |
| 29 | Elgin Baylor | 58.969 |
| 30 | Scottie Pippen | 58.852 |
| 31 | Bob Pettit | 57.009 |
| 32 | John Stockton | 55.613 |
| 33 | John Havlicek | 54.019 |
| 34 | Bob Cousy | 53.273 |
| 35 | Allen Iverson | 51.081 |
| 36 | Steve Nash | 50.325 |
| 37 | Isiah Thomas | 49.235 |
| 38 | Anthony Davis | 47.828 |
| 39 | Shai Gilgeous-Alexander | 47.772 |
| 40 | Russell Westbrook | 47.761 |
| 41 | Jason Kidd | 47.406 |
| 42 | Dwight Howard | 46.384 |
| 43 | Patrick Ewing | 44.548 |
| 44 | Clyde Drexler | 44.409 |
| 45 | Rick Barry | 44.099 |
| 46 | Luka Dončić | 42.740 |
| 47 | Joel Embiid | 42.109 |
| 48 | Gary Payton | 41.206 |
| 49 | Walt Frazier | 40.463 |
| 50 | Bob McAdoo | 40.234 |
| 51 | George Mikan | 38.945 |
| 52 | Bill Walton | 38.442 |
| 53 | Elvin Hayes | 38.440 |
| 54 | Kevin McHale | 37.776 |
| 55 | Paul Pierce | 36.682 |
| 56 | Dolph Schayes | 35.474 |
| 57 | Wes Unseld | 34.914 |
| 58 | George Gervin | 34.187 |
| 59 | Willis Reed | 33.907 |
| 60 | Tracy McGrady | 31.800 |
| 61 | Paul George | 31.538 |
| 62 | Dominique Wilkins | 31.098 |
| 63 | Ray Allen | 30.968 |
| 64 | Dave Cowens | 30.102 |
| 65 | Jerry Lucas | 29.877 |
| 66 | James Worthy | 29.580 |
| 67 | Pau Gasol | 29.504 |
| 68 | Damian Lillard | 29.133 |
| 69 | Kyrie Irving | 27.188 |
| 70 | Alonzo Mourning | 26.491 |
| 71 | Paul Arizin | 25.758 |
| 72 | Adrian Dantley | 25.738 |
| 73 | Carmelo Anthony | 25.324 |
| 74 | Jayson Tatum | 25.041 |
| 75 | Manu Ginóbili | 24.743 |
| 76 | Jimmy Butler | 24.363 |
| 77 | Robert Parish | 24.348 |
| 78 | Reggie Miller | 22.778 |
| 79 | Dennis Johnson | 22.743 |
| 80 | Bob Lanier | 22.653 |
| 81 | Chauncey Billups | 22.619 |
| 82 | Alex English | 22.544 |
| 83 | Chris Bosh | 22.268 |
| 84 | Blake Griffin | 21.106 |
| 85 | Chris Webber | 21.069 |
| 86 | Kevin Johnson | 20.566 |
| 87 | Tony Parker | 20.538 |
| 88 | Nate Thurmond | 19.795 |
| 89 | Amar'e Stoudemire | 19.779 |
| 90 | Donovan Mitchell | 19.577 |
| 91 | Vince Carter | 19.469 |
| 92 | Grant Hill | 18.866 |
| 93 | Victor Wembanyama | 18.733 |
| 94 | Devin Booker | 18.582 |
| 95 | Karl-Anthony Towns | 18.213 |
| 96 | Tiny Archibald | 18.075 |
| 97 | Sidney Moncrief | 18.063 |
| 98 | Marc Gasol | 17.822 |
| 99 | Rudy Gobert | 17.539 |
| 100 | Gus Williams | 17.511 |

## 7. Alternative views

### Human Weighted Top 25

| Rank | Player | Score |
| --- | --- | --- |
| 1 | LeBron James | 95.334 |
| 2 | Kareem Abdul-Jabbar | 94.842 |
| 3 | Michael Jordan | 93.225 |
| 4 | Kevin Durant | 89.563 |
| 5 | Tim Duncan | 89.273 |
| 6 | Shaquille O'Neal | 89.196 |
| 7 | Magic Johnson | 88.786 |
| 8 | Hakeem Olajuwon | 88.574 |
| 9 | Wilt Chamberlain | 88.468 |
| 10 | Larry Bird | 87.881 |
| 11 | Stephen Curry | 87.044 |
| 12 | Kobe Bryant | 86.828 |
| 13 | Giannis Antetokounmpo | 85.352 |
| 14 | Karl Malone | 84.938 |
| 15 | Nikola Jokić | 84.715 |
| 16 | Kevin Garnett | 84.517 |
| 17 | David Robinson | 83.997 |
| 18 | James Harden | 83.400 |
| 19 | Dirk Nowitzki | 82.337 |
| 20 | Charles Barkley | 82.305 |
| 21 | Jerry West | 81.996 |
| 22 | Dwyane Wade | 81.674 |
| 23 | Kawhi Leonard | 80.104 |
| 24 | Oscar Robertson | 80.002 |
| 25 | Chris Paul | 79.702 |

### Expert-Fitted Evidence Top 25

| Rank | Player | Score |
| --- | --- | --- |
| 1 | LeBron James | 94.223 |
| 2 | Kareem Abdul-Jabbar | 93.737 |
| 3 | Michael Jordan | 91.639 |
| 4 | Magic Johnson | 86.817 |
| 5 | Shaquille O'Neal | 84.236 |
| 6 | Kevin Durant | 84.120 |
| 7 | Wilt Chamberlain | 83.309 |
| 8 | Tim Duncan | 82.596 |
| 9 | Kobe Bryant | 82.343 |
| 10 | Hakeem Olajuwon | 81.659 |
| 11 | Larry Bird | 81.530 |
| 12 | Stephen Curry | 81.004 |
| 13 | Nikola Jokić | 75.383 |
| 14 | Giannis Antetokounmpo | 73.637 |
| 15 | Dirk Nowitzki | 69.316 |
| 16 | Karl Malone | 69.063 |
| 17 | David Robinson | 68.980 |
| 18 | Moses Malone | 68.296 |
| 19 | Jerry West | 68.119 |
| 20 | Kevin Garnett | 67.968 |
| 21 | James Harden | 66.487 |
| 22 | Oscar Robertson | 65.724 |
| 23 | Charles Barkley | 64.205 |
| 24 | Kawhi Leonard | 63.824 |
| 25 | Bill Russell | 63.572 |

### Pure Data Top 25

| Rank | Player | Score |
| --- | --- | --- |
| 1 | Kareem Abdul-Jabbar | 94.360 |
| 2 | LeBron James | 94.116 |
| 3 | Michael Jordan | 93.118 |
| 4 | Tim Duncan | 89.643 |
| 5 | Hakeem Olajuwon | 88.493 |
| 6 | Shaquille O'Neal | 87.725 |
| 7 | Magic Johnson | 87.173 |
| 8 | Kobe Bryant | 86.639 |
| 9 | Kevin Durant | 86.594 |
| 10 | Wilt Chamberlain | 86.560 |
| 11 | Larry Bird | 86.316 |
| 12 | Stephen Curry | 84.576 |
| 13 | David Robinson | 83.983 |
| 14 | Kevin Garnett | 83.275 |
| 15 | Giannis Antetokounmpo | 82.363 |
| 16 | Dwyane Wade | 80.721 |
| 17 | Karl Malone | 80.124 |
| 18 | Jerry West | 80.049 |
| 19 | Kawhi Leonard | 80.027 |
| 20 | Nikola Jokić | 79.765 |
| 21 | Dirk Nowitzki | 78.553 |
| 22 | Scottie Pippen | 77.775 |
| 23 | Dwight Howard | 77.051 |
| 24 | James Harden | 76.208 |
| 25 | Moses Malone | 75.789 |

## 8. Interesting cases

| player_name | posterior_rank | public_prior_rank | model_rank | human_rank | pure_data_rank | posterior_score | public_prior_score | model_score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Michael Jordan | 1 | 1.000 | 3 | 3 | 3 | 97.650 | 100.000 | 91.639 |
| LeBron James | 2 | 2.000 | 1 | 1 | 2 | 97.205 | 98.561 | 94.223 |
| Kareem Abdul-Jabbar | 3 | 3.000 | 2 | 2 | 1 | 95.273 | 96.144 | 93.737 |
| Magic Johnson | 4 | 4.000 | 4 | 7 | 7 | 93.122 | 95.682 | 86.817 |
| Wilt Chamberlain | 5 | 5.000 | 7 | 9 | 10 | 90.914 | 94.005 | 83.309 |
| Larry Bird | 6 | 7.000 | 11 | 10 | 11 | 87.961 | 90.662 | 81.530 |
| Tim Duncan | 7 | 8.000 | 8 | 5 | 4 | 87.649 | 89.904 | 82.596 |
| Shaquille O'Neal | 8 | 9.000 | 5 | 6 | 6 | 86.956 | 88.375 | 84.236 |
| Kobe Bryant | 9 | 10.000 | 9 | 12 | 8 | 85.821 | 87.556 | 82.343 |
| Bill Russell | 10 | 6.000 | 25 | 45 | 32 | 84.904 | 93.379 | 63.572 |
| Kevin Durant | 12 | 16.000 | 6 | 4 | 9 | 81.590 | 77.729 | 84.120 |
| Stephen Curry | 13 | 17.000 | 12 | 11 | 12 | 78.954 | 77.502 | 81.004 |
| Nikola Jokić | 14 | 13.000 | 13 | 15 | 20 | 78.695 | 83.838 | 75.383 |
| Giannis Antetokounmpo | 19 | 23.000 | 14 | 13 | 15 | 73.628 | 73.740 | 73.637 |

### Posterior materially higher than public prior

| player_name | posterior_rank | public_prior_rank | posterior_minus_prior_rank |
| --- | --- | --- | --- |
| Dwight Howard | 42 | 86.000 | -44.000 |
| Anthony Davis | 38 | 65.000 | -27.000 |
| Dolph Schayes | 56 | 82.000 | -26.000 |
| Jayson Tatum | 74 | 100.000 | -26.000 |
| Alonzo Mourning | 70 | 95.000 | -25.000 |
| Russell Westbrook | 40 | 64.000 | -24.000 |
| Adrian Dantley | 72 | 92.000 | -20.000 |
| Kawhi Leonard | 26 | 44.000 | -18.000 |
| Chauncey Billups | 81 | 99.000 | -18.000 |
| Damian Lillard | 68 | 84.000 | -16.000 |

### Posterior materially lower than public prior

| player_name | posterior_rank | public_prior_rank | posterior_minus_prior_rank |
| --- | --- | --- | --- |
| Dave DeBusschere | 171 | 104.000 | 67.000 |
| Dave Bing | 169 | 109.000 | 60.000 |
| Klay Thompson | 164 | 108.000 | 56.000 |
| Earl Monroe | 131 | 79.000 | 52.000 |
| Artis Gilmore | 156 | 110.000 | 46.000 |
| Pete Maravich | 130 | 87.000 | 43.000 |
| Vince Carter | 91 | 55.000 | 36.000 |
| Lenny Wilkens | 132 | 97.000 | 35.000 |
| Nate Thurmond | 88 | 54.000 | 34.000 |
| Dennis Rodman | 125 | 91.000 | 34.000 |

## 9. Diagnostics and limitations

The overlap screen flags 50 highly correlated raw-input pairs. The non-negative fit eliminates the v0.1 artifact where higher Peak and Playoff component scores received negative coefficients. Peak's fitted incremental coefficient is near zero after the other six correlated components enter; that is a collinearity/conditional-effect result, not a claim that peak does not matter.

Player-level playoff boxes stop at 2023-24 in the retained full-history source, while regular-season and official award/team facts extend later. Early-era steals/blocks and some advanced metrics remain structurally missing. Posterior scores describe one explicit compromise between public judgment and data; users can still select the Human or Pure Data view.
