do $$
declare
  proj_dipg13 uuid;
  proj_medullo uuid;
  sample_a uuid;
  sample_b uuid;
  sample_c uuid;
  sample_d uuid;
  sample_e uuid;
begin
  insert into public.projects (code, title, description)
  values (
    'DIPG13',
    'DIPG13 Radiation Response Cohort',
    'Parental and KO cell models with 5Gy or sham treatment.'
  )
  on conflict (code) do update
    set title = excluded.title,
        description = excluded.description,
        updated_at = now()
  returning id into proj_dipg13;

  if proj_dipg13 is null then
    select id into proj_dipg13 from public.projects where code = 'DIPG13';
  end if;

  insert into public.projects (code, title, description)
  values (
    'MEDULLO-A',
    'Medulloblastoma Validation Cohort A',
    'Pilot sequencing cohort for medulloblastoma samples.'
  )
  on conflict (code) do update
    set title = excluded.title,
        description = excluded.description,
        updated_at = now()
  returning id into proj_medullo;

  if proj_medullo is null then
    select id into proj_medullo from public.projects where code = 'MEDULLO-A';
  end if;

  insert into public.project_samples (project_id, name, tissue_type, library_type, source)
  values
    (proj_dipg13, 'DIPG13_K27M_5Gy_1', 'cell line', 'RNA-seq', 'DIPG13'),
    (proj_dipg13, 'DIPG13_K27M_control_1', 'cell line', 'RNA-seq', 'DIPG13'),
    (proj_dipg13, 'DIPG13_KO_5Gy_1', 'cell line', 'Ribo-seq', 'DIPG13'),
    (proj_medullo, 'MB_101_primary', 'tumor', 'RNA-seq', 'MedulloBank'),
    (proj_medullo, 'MB_102_primary', 'tumor', 'Ribo-seq', 'MedulloBank')
  on conflict (project_id, name) do update
    set tissue_type = excluded.tissue_type,
        library_type = excluded.library_type,
        source = excluded.source,
        updated_at = now();

  select id into sample_a from public.project_samples where project_id = proj_dipg13 and name = 'DIPG13_K27M_5Gy_1';
  select id into sample_b from public.project_samples where project_id = proj_dipg13 and name = 'DIPG13_K27M_control_1';
  select id into sample_c from public.project_samples where project_id = proj_dipg13 and name = 'DIPG13_KO_5Gy_1';
  select id into sample_d from public.project_samples where project_id = proj_medullo and name = 'MB_101_primary';
  select id into sample_e from public.project_samples where project_id = proj_medullo and name = 'MB_102_primary';

  delete from public.sample_status_updates
  where sample_id in (sample_a, sample_b, sample_c, sample_d, sample_e);

  insert into public.sample_status_updates (sample_id, status, notes, created_at)
  values
    (sample_a, 'not started', 'Queue created for extraction.', now() - interval '5 days'),
    (sample_a, 'in progress', 'Library prep started.', now() - interval '3 days'),
    (sample_a, 'data generated', 'Reads passed initial QC.', now() - interval '1 day'),

    (sample_b, 'not started', 'Waiting for batching window.', now() - interval '4 days'),

    (sample_c, 'not started', 'Queued after radiation arm complete.', now() - interval '6 days'),
    (sample_c, 'in progress', 'Ribo pull-down in progress.', now() - interval '2 days'),

    (sample_d, 'not started', 'Intake complete.', now() - interval '7 days'),
    (sample_d, 'in progress', 'Sequencer lane assigned.', now() - interval '2 days'),
    (sample_d, 'failed', 'Low library complexity on QC.', now() - interval '6 hours'),

    (sample_e, 'not started', 'Sample registered.', now() - interval '3 days');
end;
$$;
