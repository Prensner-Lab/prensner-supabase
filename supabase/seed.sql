do $$
declare
  sheet_id uuid;
  proj_dipg13 uuid;
  proj_medullo uuid;
  sample_a uuid;
  sample_b uuid;
  sample_c uuid;
  sample_d uuid;
  sample_e uuid;
begin
  insert into public.samplesheets (
    pi_name,
    date,
    submitter_name,
    submitter_email,
    project_id,
    project_title,
    experiment_type,
    project_description,
    filename
  ) values (
    null,
    '2025-01-01',
    null,
    null,
    'DIPG13',
    'DIPG13 Radiation Response',
    'Ribo_seq,RNA_seq',
    'DIPG13 parental (K27M) and KO cells treated with 5Gy radiation or sham; samples collected 24hrs post-treatment.',
    'samplesheet-example.csv'
  )
  returning id into sheet_id;

  insert into public.samplesheet_entries (
    samplesheet_id, run_id, smart_id, data_type, species, sample_type, source_id,
    is_paired_end, read_end, replicate_num, test_or_control, location_id,
    disease_id, treatment_id, genetic_factors, sequencing_instrument, batch_date, description
  ) values
    (sheet_id,'DIPG13_K27M_5Gy_1_S9_M0T1FR1_001.fastq.gz','DIPG13_K27M_5Gy_1','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',1,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_5Gy_2_S10_M0T1FR1_001.fastq.gz','DIPG13_K27M_5Gy_2','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',2,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_5Gy_3_S11_M0T1FR1_001.fastq.gz','DIPG13_K27M_5Gy_3','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',3,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_K27M_no_IR_1_S5_M0T1FR1_001.fastq.gz','DIPG13_K27M_control_1','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',1,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_no_IR_2_S6_M0T1FR1_001.fastq.gz','DIPG13_K27M_control_2','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',2,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_no_IR_3_S7_M0T1FR1_001.fastq.gz','DIPG13_K27M_control_3','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',3,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_5Gy_1_S15_M0T1FR1_001.fastq.gz','DIPG13_KO_5Gy_1','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',1,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_5Gy_2_S16_M0T1FR1_001.fastq.gz','DIPG13_KO_5Gy_2','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',2,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_5Gy_3_S17_M0T1FR1_001.fastq.gz','DIPG13_KO_5Gy_3','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',3,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_no_IR_1_S12_M0T1FR1_001.fastq.gz','DIPG13_KO_control_1','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',1,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_no_IR_2_S13_M0T1FR1_001.fastq.gz','DIPG13_KO_control_2','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',2,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_no_IR_3_S14_M0T1FR1_001.fastq.gz','DIPG13_KO_control_3','Ribo_seq','homo_sapiens','Cell_line','DIPG13',false,'R1',3,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_K27M_5Gy_1_S135_R1_001.fastq.gz','DIPG13_K27M_5Gy_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',1,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_5Gy_1_S135_R2_001.fastq.gz','DIPG13_K27M_5Gy_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',1,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_5Gy_2_S136_R1_001.fastq.gz','DIPG13_K27M_5Gy_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',2,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_5Gy_2_S136_R2_001.fastq.gz','DIPG13_K27M_5Gy_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',2,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_5Gy_3_S137_R1_001.fastq.gz','DIPG13_K27M_5Gy_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',3,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_K27M_5Gy_3_S137_R2_001.fastq.gz','DIPG13_K27M_5Gy_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',3,'test','BRAIN.PONS','DMG.H3_3K27M','K27M:5Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_K27M_no_IR_1_S132_R1_001.fastq.gz','DIPG13_K27M_control_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',1,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_no_IR_1_S132_R2_001.fastq.gz','DIPG13_K27M_control_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',1,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_K27M_no_IR_2_S133_R1_001.fastq.gz','DIPG13_K27M_control_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',2,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_no_IR_2_S133_R2_001.fastq.gz','DIPG13_K27M_control_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',2,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_K27M_no_IR_3_S134_R1_001.fastq.gz','DIPG13_K27M_control_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',3,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_K27M_no_IR_3_S134_R2_001.fastq.gz','DIPG13_K27M_control_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',3,'control','BRAIN.PONS','DMG.H3_3K27M','K27M:0Gy','NA','NovaSeq','2025-01-01','DIPG13 parental cells treated with sham treatment (no radiation), sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_5Gy_1_S141_R1_001.fastq.gz','DIPG13_KO_5Gy_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',1,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_5Gy_1_S141_R2_001.fastq.gz','DIPG13_KO_5Gy_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',1,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_5Gy_2_S142_R1_001.fastq.gz','DIPG13_KO_5Gy_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',2,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_5Gy_2_S142_R2_001.fastq.gz','DIPG13_KO_5Gy_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',2,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_5Gy_3_S143_R1_001.fastq.gz','DIPG13_KO_5Gy_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',3,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_5Gy_3_S143_R2_001.fastq.gz','DIPG13_KO_5Gy_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',3,'test','BRAIN.PONS','DMG.H3_3K27M','KO:5Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with 5Gy radiation in one dose, sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_no_IR_1_S138_R1_001.fastq.gz','DIPG13_KO_control_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',1,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_no_IR_1_S138_R2_001.fastq.gz','DIPG13_KO_control_1','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',1,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep1'),
    (sheet_id,'DIPG13_KO_no_IR_2_S139_R1_001.fastq.gz','DIPG13_KO_control_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',2,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_no_IR_2_S139_R2_001.fastq.gz','DIPG13_KO_control_2','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',2,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep2'),
    (sheet_id,'DIPG13_KO_no_IR_3_S140_R1_001.fastq.gz','DIPG13_KO_control_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R1',3,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep3'),
    (sheet_id,'DIPG13_KO_no_IR_3_S140_R2_001.fastq.gz','DIPG13_KO_control_3','RNA_seq','homo_sapiens','Cell_line','DIPG13',true,'R2',3,'control','BRAIN.PONS','DMG.H3_3K27M','KO:0Gy','NA','NovaSeq','2025-01-01','DIPG13_KO cells (lacking H3K27M mutation) treated with sham treatment (no radiation), sample collected 24hrs later, rep3');

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
