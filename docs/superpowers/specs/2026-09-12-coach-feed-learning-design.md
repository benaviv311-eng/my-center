# Coach Feed & Learning Design

## Goal
Turn `coach.html` into an active learning hub for the coach, combining a dynamic feed with a sticky topic navigation bar. The page should continuously mix inspiration, applied coaching knowledge, sport psychology, volleyball ideas, research summaries, training language, explosive-power science, and interactive multiple-choice questions embedded naturally in the scroll.

## Primary Experience
The coach page opens with a feed rather than a static reference page. Cards are mixed and refreshed so each visit feels alive. The feed should include:

- Motivational sentences relevant to coaches and athletes.
- Useful quotations and ideas from books already represented in the site's library.
- Random sport-psychology insights that connect to coaching practice.
- Volleyball-related quotations and ideas from useful coaching and sport sources.
- Practical volleyball concepts.
- Research-in-a-minute summaries.
- One actionable suggestion to try in the next practice.
- Coaching-language prompts and phrases.
- Short scenarios from practice or competition.
- Common coaching mistakes and better alternatives.
- Leadership, confidence, focus, motivation, resilience, team cohesion, recovery from mistakes, and decision-making content.
- Training drills or practice-design ideas when appropriate.
- Saved/favorite cards and refresh actions can be added as the feed matures.

Content that comes from a library book should identify the source and support navigation back to that book where practical.

## Sticky Topic Navigation
A sticky navigation row remains available while scrolling. It contains six fixed topics:

1. פסיכולוגיה של הספורט
2. פסיכולוגיית אימון
3. פסיכולוגיה של תנועה
4. כוח מתפרץ
5. שפת אימון
6. גישות לכדורעף

Selecting a topic filters/focuses the stream to that knowledge domain without changing the page into a separate quiz mode.

## Topic Structures

### 1. פסיכולוגיה של הספורט
Purpose: understand the athlete as a person and performer.

Subtopics:
- Self-Determination Theory.
- Growth Mindset.
- Self-Efficacy.
- Flow.
- Achievement Goal Theory.
- Pressure and competitive anxiety.
- Confidence.
- Intrinsic/extrinsic motivation and burnout.
- Attention and concentration.
- Resilience after mistakes, losses, benching, or setbacks.
- Team cohesion, trust, roles, and leadership.
- Volleyball-specific applications.
- Research takeaway and evidence strength when research is presented.
- A practical action for the coach.

### 2. פסיכולוגיית אימון
Purpose: improve the coach-created learning and interpersonal environment.

Subtopics:
- Feedback timing and dosage.
- Knowledge of Results vs Knowledge of Performance.
- Asking questions instead of always giving answers.
- Learning from mistakes.
- Directed vs guided/discovery-based coaching.
- Player autonomy and independence.
- Competition inside practice.
- Coach-athlete relationship, trust, authority, and boundaries.
- Team management, playing time, substitutes, conflict.
- Age-specific adaptations: children, youth, adults.
- Coaching scenarios with response options.
- Practical sentences the coach can use immediately.

### 3. פסיכולוגיה של תנועה
Purpose: connect cognition, perception, decision-making, and motor learning.

Subtopics:
- Motor learning.
- External Focus vs Internal Focus.
- Implicit Learning.
- Random vs Blocked Practice.
- Variability of Practice.
- Contextual Interference.
- Perception-Action Coupling.
- Anticipation and reading the game.
- Reaction vs decision-making.
- Constraints-Led Approach.
- Differential Learning.
- Memory, repetition, adaptation, and skill acquisition.
- Volleyball applications in reception, defense, serving, setting, and attacking.
- Drill transformations: turning closed technique work into perceptual/decision tasks.
- Common instruction mistakes.

### 4. כוח מתפרץ
Purpose: become a scientific and practical hub for jumping and volleyball athleticism.

Subtopics:
- Current research summaries.
- Evidence-strength marker: strong / moderate / preliminary.
- Jump science: force, velocity, RFD, stretch-shortening cycle.
- Vertical jump determinants.
- Plyometrics: load, volume, intensity, frequency.
- Strength training.
- Ballistic/Olympic-lift concepts where appropriate.
- Sprint and agility.
- Landing mechanics and control.
- Reactive Strength.
- Isometrics.
- Unilateral training.
- Weekly integration of strength and volleyball practice.
- Fatigue and recovery.
- Jump-training exercise library by level.
- Testing concepts such as CMJ, SJ, RSI.
- “Why does this work?” scientific explanations.
- Example programs for beginner, youth, and advanced athletes.

Research content should be dated where possible and clearly distinguish established evidence from emerging findings.

### 5. שפת אימון
Purpose: create a usable bank of coaching communication.

Subtopics:
- Before a drill.
- During a drill.
- After a mistake.
- After success.
- Before a match.
- Timeout language.
- After a loss.
- After a win.
- Anxious player.
- Angry player.
- Low-confidence player.
- Player who is not listening.
- Substitute/bench player.
- Captain communication.
- Adaptation for children, youth, adults.
- External-focus cues.
- Phrases to avoid and why.
- Reframing negative/internal instructions into useful action cues.

### 6. גישות לכדורעף
Purpose: compare ways of teaching and training volleyball.

Subtopics:
- Technical/repetition-based approach.
- Game-Based Learning.
- Constraints-Led volleyball.
- Small-Sided Games.
- Ecological Dynamics.
- Teaching Games for Understanding.
- Serve-receive philosophy.
- Side-out vs transition priorities.
- Reading the game and decision-making.
- Long-term player development.
- Early specialization vs broader development.
- Team training culture.
- Approaches used by different coaches.
- Pros and cons of each approach.
- Fit by age and competitive level.
- Example practice built around an approach.
- Direct comparisons such as Blocked Drill vs Game-Based practice.
- “What would I do in practice?” practical recommendation.

## Embedded Interactive Questions
Questions are part of the normal scroll. There is no separate “בחן אותי” mode.

Question cards should appear naturally among normal feed cards, with frequency weighted by content type rather than on a rigid every-N-cards schedule. Practical domains can contain more questions than research-heavy sections.

Question types:
- Multiple-choice factual understanding.
- “What would you choose?” scenario questions.
- “Which response is best?” coaching-language decisions.
- Practice-design choices.
- Applied science questions in explosive power.

Each question card contains 3–4 clear answer choices. After the user chooses, the card expands to show:

1. Whether the selected answer is recommended/correct.
2. A concise explanation.
3. The principle or theory behind the answer.
4. A volleyball/coaching application.

The tone must feel like active learning inside the feed, not like an exam.

## Repetition Through Scrolling
Previously encountered concepts should reappear over time in different forms: quote, explanation, scenario, question, application, common mistake, or research summary. This provides spaced repetition without a dedicated test screen.

Questions may revisit earlier material using new wording or a new practical situation. Repetition should feel useful rather than repetitive.

## Card Model
The feed should be data-driven rather than hard-coded as long HTML sections. Each card should have a small, explicit structure such as:

- `id`
- `topic`
- `type`
- `title`
- `body`
- optional `source`
- optional `bookId`
- optional `evidenceStrength`
- optional `question`
- optional `options`
- optional `correctOption`
- optional `explanation`
- optional `principle`
- optional `application`
- optional tags

This makes filtering, mixing, refreshing, and future expansion possible without rewriting the page structure.

## Initial Interaction Rules
- The feed loads a mixed set of cards on first view.
- Sticky topic buttons filter the stream by topic.
- Question cards reveal feedback only after a choice.
- Answers remain readable after selection.
- The user can continue scrolling immediately after answering.
- Existing site navigation remains available.
- The coach page stays RTL and visually consistent with the rest of “המרכז שלי”.

## Source Integrity
- Do not invent quotations and attribute them to real books, coaches, or researchers.
- Direct quotations should be used only when the exact wording and source are verified and permitted; otherwise label content as a paraphrased idea or summary.
- Research cards should identify the research/source/date when actual studies are included.
- Library-derived material should distinguish an exact quotation from a summary/idea.

## Scope for First Implementation
The first build should focus on the reusable feed system, sticky six-topic navigation, a meaningful starter content bank for every topic, and embedded interactive question cards. It does not need personalization algorithms, user accounts, cloud persistence, or automatic external research ingestion yet.

Future iterations can add favorites, richer refresh controls, personalization from saved cards, automatic research updates, and direct links from cards into practice-building tools.

## Success Criteria
The feature is successful when:

- `coach.html` no longer feels like a static notes page.
- The six fixed topic areas are always easy to reach while scrolling.
- Every topic contains useful learning content and practical volleyball context.
- Questions appear inside the scroll and can be answered directly.
- Choosing an answer produces immediate explanatory feedback.
- The same concepts can recur in varied forms for natural repetition.
- Content provenance is honest and quotations are not fabricated.
- The implementation is easy to extend with more content cards later.
