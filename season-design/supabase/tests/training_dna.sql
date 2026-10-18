begin;
select plan(2);

select has_column(
  'public', 'exercise_versions', 'planning_metadata',
  'versioned exercises have optional planning metadata'
);

select col_type_is(
  'public', 'exercise_versions', 'planning_metadata', 'jsonb',
  'planning metadata uses immutable version-level JSONB'
);

select * from finish();
rollback;
