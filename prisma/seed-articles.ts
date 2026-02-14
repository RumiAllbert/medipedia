import "dotenv/config";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Article data                                                       */
/* ------------------------------------------------------------------ */

interface ArticleSeed {
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  confidenceLabel: string;
  trustScore: number;
  evidenceScore: number;
  freshnessScore: number;
  consensusScore: number;
  tags: string[];
  entities: string[];
  keyFacts: string[];
  readingLevel: string;
  citations: { title: string; url: string; sourceType: string }[];
  relatedSlugs: { slug: string; title: string; score: number; reason: string }[];
}

const articles: ArticleSeed[] = [
  /* ── Cardiovascular ─────────────────────────────────────────────── */
  {
    slug: "heart-failure",
    title: "Heart Failure",
    summary:
      "Heart failure occurs when the heart cannot pump enough blood to meet the body's needs, leading to fatigue, shortness of breath, and fluid retention.",
    bodyMarkdown: `## Overview
Heart failure is a chronic, progressive condition in which the heart muscle is unable to pump sufficient blood to meet the body's demands. It can affect the left side, right side, or both sides of the heart.

## Symptoms
Common symptoms include shortness of breath (dyspnea), persistent coughing or wheezing, fatigue, swelling in the legs, ankles, and feet, rapid or irregular heartbeat, and reduced ability to exercise.

## Causes
Heart failure is most commonly caused by conditions that damage or overwork the heart, including coronary artery disease, hypertension, diabetes, obesity, and valvular heart disease. Previous heart attacks are a major risk factor.

## Treatment
Treatment includes lifestyle changes, medications (ACE inhibitors, beta-blockers, diuretics), and in advanced cases, devices such as implantable defibrillators or ventricular assist devices, or heart transplantation.

## Prevention
Controlling risk factors such as high blood pressure, diabetes, and coronary artery disease can help prevent heart failure. Maintaining a healthy weight, exercising regularly, and avoiding tobacco are key.

## When to seek care
Seek emergency care for sudden severe shortness of breath, chest pain, or fainting. Contact your doctor if you notice worsening swelling, rapid weight gain, or increasing fatigue.`,
    confidenceLabel: "HIGH",
    trustScore: 90,
    evidenceScore: 92,
    freshnessScore: 86,
    consensusScore: 91,
    tags: ["cardiovascular", "chronic disease", "pharmacotherapy"],
    entities: ["heart failure", "dyspnea", "ACE inhibitors", "cardiomyopathy"],
    keyFacts: [
      "Heart failure affects about 6 million adults in the US.",
      "It is a leading cause of hospitalization in people over 65.",
      "Early treatment can significantly improve quality of life.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Cardiovascular Diseases", url: "https://www.who.int/health-topics/cardiovascular-diseases", sourceType: "public-health" },
      { title: "CDC - Heart Failure", url: "https://www.cdc.gov/heart-failure/about/index.html", sourceType: "government" },
      { title: "NEJM - Heart Failure Review", url: "https://www.nejm.org/doi/full/10.1056/NEJMra2106038", sourceType: "journal" },
    ],
    relatedSlugs: [
      { slug: "hypertension", title: "Hypertension", score: 0.88, reason: "Leading cause and risk factor for heart failure." },
      { slug: "coronary-artery-disease", title: "Coronary Artery Disease", score: 0.85, reason: "Most common underlying cause of heart failure." },
      { slug: "atrial-fibrillation", title: "Atrial Fibrillation", score: 0.78, reason: "Frequently coexists and worsens heart failure outcomes." },
    ],
  },
  {
    slug: "coronary-artery-disease",
    title: "Coronary Artery Disease",
    summary:
      "Coronary artery disease is the most common type of heart disease, caused by plaque buildup in the arteries supplying blood to the heart.",
    bodyMarkdown: `## Overview
Coronary artery disease (CAD) develops when the major blood vessels supplying the heart become damaged or diseased due to atherosclerosis — the buildup of cholesterol-containing deposits (plaques) on artery walls.

## Symptoms
Many people have no symptoms in the early stages. As the disease progresses, symptoms may include angina (chest pain or discomfort), shortness of breath, fatigue, and in severe cases, heart attack.

## Causes
CAD is primarily caused by atherosclerosis. Risk factors include high cholesterol, hypertension, diabetes, smoking, obesity, physical inactivity, family history, and age.

## Treatment
Treatment includes lifestyle modifications, medications (statins, antiplatelet agents, beta-blockers, ACE inhibitors), and procedures such as angioplasty with stenting or coronary artery bypass surgery.

## Prevention
Heart-healthy lifestyle choices are the best prevention: regular exercise, a balanced diet low in saturated fat and sodium, maintaining a healthy weight, not smoking, and managing stress.

## When to seek care
Seek emergency care immediately if you experience chest pain, shortness of breath, or symptoms of a heart attack (pain radiating to the arm, jaw, or back; nausea; lightheadedness).`,
    confidenceLabel: "HIGH",
    trustScore: 91,
    evidenceScore: 93,
    freshnessScore: 87,
    consensusScore: 92,
    tags: ["cardiovascular", "chronic disease", "prevention"],
    entities: ["coronary artery disease", "atherosclerosis", "angina", "statins", "myocardial infarction"],
    keyFacts: [
      "CAD is the leading cause of death worldwide.",
      "Atherosclerosis can begin in childhood and progress silently for decades.",
      "Lifestyle changes can halt or reverse early plaque buildup.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Cardiovascular Diseases", url: "https://www.who.int/health-topics/cardiovascular-diseases", sourceType: "public-health" },
      { title: "NIH - Coronary Artery Disease", url: "https://www.nhlbi.nih.gov/health/coronary-heart-disease", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "heart-failure", title: "Heart Failure", score: 0.85, reason: "CAD is the most common cause of heart failure." },
      { slug: "hyperlipidemia", title: "Hyperlipidemia", score: 0.82, reason: "High cholesterol directly contributes to plaque formation." },
      { slug: "hypertension", title: "Hypertension", score: 0.80, reason: "Hypertension accelerates arterial damage and atherosclerosis." },
      { slug: "stroke", title: "Stroke", score: 0.74, reason: "Shared atherosclerotic disease process." },
    ],
  },
  {
    slug: "atrial-fibrillation",
    title: "Atrial Fibrillation",
    summary:
      "Atrial fibrillation (AFib) is an irregular, often rapid heart rhythm that increases the risk of stroke, heart failure, and other heart-related complications.",
    bodyMarkdown: `## Overview
Atrial fibrillation is the most common type of treated heart arrhythmia. In AFib, the heart's upper chambers (atria) beat chaotically and out of coordination with the lower chambers (ventricles).

## Symptoms
Symptoms may include heart palpitations, shortness of breath, weakness, fatigue, dizziness, chest pain, and reduced ability to exercise. Some people with AFib have no symptoms.

## Causes
Common causes and risk factors include high blood pressure, heart attacks, coronary artery disease, heart valve abnormalities, congenital heart defects, hyperthyroidism, excessive alcohol or caffeine, sleep apnea, and obesity.

## Treatment
Treatment focuses on heart rate control, rhythm restoration, and stroke prevention. Options include medications (rate or rhythm control drugs, anticoagulants), cardioversion, catheter ablation, and surgical procedures.

## Prevention
Managing underlying conditions such as high blood pressure and sleep apnea can reduce AFib risk. Heart-healthy lifestyle choices, limiting alcohol and caffeine, and maintaining a healthy weight are important.

## When to seek care
Seek immediate medical attention if you experience chest pain, severe shortness of breath, or fainting. See your doctor for any new or worsening irregular heartbeat.`,
    confidenceLabel: "HIGH",
    trustScore: 87,
    evidenceScore: 89,
    freshnessScore: 84,
    consensusScore: 86,
    tags: ["cardiovascular", "chronic disease", "pharmacotherapy"],
    entities: ["atrial fibrillation", "arrhythmia", "anticoagulants", "catheter ablation"],
    keyFacts: [
      "AFib affects an estimated 2.7-6.1 million people in the US.",
      "People with AFib are 5 times more likely to have a stroke.",
      "Many people with AFib need blood thinners to prevent clots.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "CDC - Atrial Fibrillation", url: "https://www.cdc.gov/heart-disease/about/atrial-fibrillation.html", sourceType: "government" },
      { title: "NIH - Atrial Fibrillation", url: "https://www.nhlbi.nih.gov/health/atrial-fibrillation", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "stroke", title: "Stroke", score: 0.87, reason: "AFib is a major risk factor for ischemic stroke." },
      { slug: "heart-failure", title: "Heart Failure", score: 0.78, reason: "AFib often coexists with and worsens heart failure." },
      { slug: "sleep-apnea", title: "Sleep Apnea", score: 0.68, reason: "Sleep apnea is a significant modifiable risk factor for AFib." },
    ],
  },
  {
    slug: "stroke",
    title: "Stroke",
    summary:
      "A stroke occurs when the blood supply to part of the brain is interrupted or reduced, depriving brain tissue of oxygen and nutrients. It is a medical emergency.",
    bodyMarkdown: `## Overview
A stroke is a serious medical emergency that occurs when blood flow to the brain is blocked (ischemic stroke) or when a blood vessel in the brain bursts (hemorrhagic stroke). Rapid treatment is crucial for survival and minimizing brain damage.

## Symptoms
Symptoms include sudden numbness or weakness (especially on one side of the body), confusion, trouble speaking or understanding speech, vision problems, severe headache, and difficulty walking. Remember FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services.

## Causes
Ischemic strokes are caused by blood clots, often from atherosclerosis or atrial fibrillation. Hemorrhagic strokes are caused by burst blood vessels, often due to uncontrolled hypertension. Risk factors include high blood pressure, heart disease, diabetes, smoking, and obesity.

## Treatment
Ischemic strokes can be treated with clot-busting drugs (tPA) given within hours of symptom onset, or mechanical thrombectomy. Hemorrhagic strokes may require surgical intervention. Rehabilitation is often needed for recovery.

## Prevention
Control blood pressure, manage diabetes, treat atrial fibrillation, quit smoking, maintain a healthy weight, exercise regularly, eat a heart-healthy diet, and limit alcohol consumption.

## When to seek care
Call emergency services immediately at any sign of stroke. Every minute counts — treatment within the first hours dramatically improves outcomes.`,
    confidenceLabel: "HIGH",
    trustScore: 92,
    evidenceScore: 94,
    freshnessScore: 88,
    consensusScore: 93,
    tags: ["cardiovascular", "neurological", "prevention"],
    entities: ["stroke", "ischemic stroke", "hemorrhagic stroke", "tPA", "thrombectomy"],
    keyFacts: [
      "Stroke is a leading cause of death and long-term disability worldwide.",
      "About 80% of strokes are ischemic (caused by blood clots).",
      "Treatment within the first hours can dramatically improve outcomes.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Stroke", url: "https://www.who.int/news-room/fact-sheets/detail/stroke", sourceType: "public-health" },
      { title: "CDC - Stroke", url: "https://www.cdc.gov/stroke/about/index.html", sourceType: "government" },
      { title: "NIH - Stroke Information", url: "https://www.ninds.nih.gov/health-information/disorders/stroke", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "hypertension", title: "Hypertension", score: 0.90, reason: "Hypertension is the single biggest risk factor for stroke." },
      { slug: "atrial-fibrillation", title: "Atrial Fibrillation", score: 0.87, reason: "AFib is a leading cause of ischemic stroke." },
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.72, reason: "Diabetes significantly increases stroke risk." },
    ],
  },
  {
    slug: "deep-vein-thrombosis",
    title: "Deep Vein Thrombosis",
    summary:
      "Deep vein thrombosis (DVT) is a blood clot that forms in a deep vein, usually in the legs. It can be dangerous if the clot breaks loose and travels to the lungs.",
    bodyMarkdown: `## Overview
Deep vein thrombosis (DVT) occurs when a blood clot (thrombus) forms in one or more of the deep veins in the body, usually in the legs. DVT can lead to serious complications, including pulmonary embolism.

## Symptoms
Signs and symptoms include swelling in the affected leg, pain or tenderness (often starting in the calf), red or discolored skin, and a feeling of warmth. Some people have DVT without noticeable symptoms.

## Causes
DVT can be caused by anything that prevents blood from circulating or clotting normally. Risk factors include prolonged immobility, surgery, injury, cancer, obesity, pregnancy, oral contraceptives, inherited clotting disorders, and age over 60.

## Treatment
Treatment typically involves anticoagulant medications (blood thinners) to prevent the clot from growing and reduce the risk of additional clots. In severe cases, thrombolytics or surgical thrombectomy may be needed. Compression stockings are often recommended.

## Prevention
Move regularly, especially during long trips or after surgery. Maintain a healthy weight, stay active, avoid prolonged sitting, stay hydrated, and discuss risk factors with your doctor before surgery.

## When to seek care
Seek emergency care if you have signs of a pulmonary embolism: sudden shortness of breath, chest pain that worsens with breathing, rapid pulse, coughing up blood, or feeling faint.`,
    confidenceLabel: "MODERATE",
    trustScore: 81,
    evidenceScore: 83,
    freshnessScore: 78,
    consensusScore: 80,
    tags: ["cardiovascular", "blood pressure", "pharmacotherapy"],
    entities: ["deep vein thrombosis", "pulmonary embolism", "anticoagulants", "thrombosis"],
    keyFacts: [
      "DVT affects an estimated 900,000 people in the US each year.",
      "Pulmonary embolism, a DVT complication, can be fatal.",
      "Early treatment with blood thinners is highly effective.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "CDC - Venous Thromboembolism", url: "https://www.cdc.gov/blood-clots/about/index.html", sourceType: "government" },
      { title: "MedlinePlus - Deep Vein Thrombosis", url: "https://medlineplus.gov/deepveinthrombosis.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "stroke", title: "Stroke", score: 0.65, reason: "Blood clotting conditions share pathophysiology." },
      { slug: "obesity", title: "Obesity", score: 0.62, reason: "Obesity is a significant risk factor for DVT." },
    ],
  },

  /* ── Metabolic ──────────────────────────────────────────────────── */
  {
    slug: "type-2-diabetes",
    title: "Type 2 Diabetes",
    summary:
      "Type 2 diabetes is a chronic condition that affects how the body processes blood sugar (glucose), leading to high blood sugar levels that can damage multiple organ systems.",
    bodyMarkdown: `## Overview
Type 2 diabetes is the most common form of diabetes. In this condition, the body either doesn't produce enough insulin or becomes resistant to insulin's effects, leading to elevated blood glucose levels.

## Symptoms
Symptoms develop gradually and may include increased thirst, frequent urination, increased hunger, unintended weight loss, fatigue, blurred vision, slow-healing sores, frequent infections, and areas of darkened skin.

## Causes
Type 2 diabetes develops when the body becomes resistant to insulin or when the pancreas can't produce enough insulin. Risk factors include obesity, physical inactivity, family history, age, race/ethnicity, and gestational diabetes history.

## Treatment
Management includes blood sugar monitoring, healthy eating, regular exercise, and medications (metformin, sulfonylureas, GLP-1 receptor agonists, SGLT2 inhibitors, insulin). Comprehensive care also addresses blood pressure and cholesterol.

## Prevention
Type 2 diabetes can often be prevented or delayed through lifestyle changes: maintaining a healthy weight, regular physical activity, eating a balanced diet rich in whole grains, fruits, and vegetables, and avoiding tobacco use.

## When to seek care
Seek immediate care for very high blood sugar symptoms (extreme thirst, very frequent urination, confusion) or very low blood sugar symptoms (shakiness, sweating, confusion, loss of consciousness).`,
    confidenceLabel: "HIGH",
    trustScore: 93,
    evidenceScore: 95,
    freshnessScore: 89,
    consensusScore: 92,
    tags: ["metabolic", "chronic disease", "prevention", "pharmacotherapy"],
    entities: ["type 2 diabetes", "insulin resistance", "metformin", "hyperglycemia", "HbA1c"],
    keyFacts: [
      "Over 37 million Americans have diabetes, with type 2 accounting for 90-95% of cases.",
      "Type 2 diabetes can be prevented or delayed with lifestyle changes.",
      "Unmanaged diabetes can lead to complications in the heart, kidneys, eyes, and nerves.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Diabetes", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", sourceType: "public-health" },
      { title: "CDC - Type 2 Diabetes", url: "https://www.cdc.gov/diabetes/about/about-type-2-diabetes.html", sourceType: "government" },
      { title: "NIH - Diabetes Overview", url: "https://www.niddk.nih.gov/health-information/diabetes/overview", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "obesity", title: "Obesity", score: 0.90, reason: "Obesity is the strongest modifiable risk factor for type 2 diabetes." },
      { slug: "metabolic-syndrome", title: "Metabolic Syndrome", score: 0.87, reason: "Type 2 diabetes is a core component of metabolic syndrome." },
      { slug: "chronic-kidney-disease", title: "Chronic Kidney Disease", score: 0.80, reason: "Diabetes is the leading cause of chronic kidney disease." },
      { slug: "coronary-artery-disease", title: "Coronary Artery Disease", score: 0.76, reason: "Diabetes significantly increases cardiovascular risk." },
    ],
  },
  {
    slug: "obesity",
    title: "Obesity",
    summary:
      "Obesity is a complex chronic disease involving an excessive amount of body fat that increases the risk of other diseases and health problems.",
    bodyMarkdown: `## Overview
Obesity is defined as having a body mass index (BMI) of 30 or higher. It is a complex, multifactorial condition influenced by genetics, environment, behavior, and metabolic factors.

## Symptoms
Beyond excess weight, obesity may cause shortness of breath, increased sweating, joint pain, fatigue, sleep difficulties, low self-esteem, and difficulty performing physical activities.

## Causes
Obesity results from a complex interaction of factors including genetics, metabolism, diet, physical activity, sleep, stress, and environmental factors. Certain medications and medical conditions can also contribute.

## Treatment
Treatment is multimodal and may include dietary changes, increased physical activity, behavioral counseling, medications (GLP-1 receptor agonists, orlistat), and bariatric surgery for severe cases. A sustainable approach is essential.

## Prevention
Prevention strategies include regular physical activity, a balanced nutrient-dense diet, adequate sleep, stress management, limiting processed foods and sugary beverages, and creating supportive environments.

## When to seek care
Consult a healthcare provider if you have difficulty managing your weight, especially if you have related health conditions such as diabetes, high blood pressure, or sleep apnea.`,
    confidenceLabel: "HIGH",
    trustScore: 88,
    evidenceScore: 90,
    freshnessScore: 85,
    consensusScore: 87,
    tags: ["metabolic", "chronic disease", "lifestyle", "prevention"],
    entities: ["obesity", "BMI", "bariatric surgery", "GLP-1 receptor agonists"],
    keyFacts: [
      "Over 40% of US adults have obesity.",
      "Obesity is associated with at least 200 other health conditions.",
      "Even modest weight loss (5-10%) can significantly improve health outcomes.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Obesity", url: "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight", sourceType: "public-health" },
      { title: "CDC - Adult Obesity Facts", url: "https://www.cdc.gov/obesity/php/data-research/adult-obesity-facts.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.90, reason: "Obesity is the leading modifiable risk factor for type 2 diabetes." },
      { slug: "metabolic-syndrome", title: "Metabolic Syndrome", score: 0.85, reason: "Central obesity is a defining feature of metabolic syndrome." },
      { slug: "sleep-apnea", title: "Sleep Apnea", score: 0.78, reason: "Obesity is the strongest risk factor for obstructive sleep apnea." },
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.75, reason: "Physical activity is fundamental to obesity management." },
    ],
  },
  {
    slug: "metabolic-syndrome",
    title: "Metabolic Syndrome",
    summary:
      "Metabolic syndrome is a cluster of conditions — high blood pressure, high blood sugar, excess waist fat, and abnormal cholesterol levels — that increase the risk of heart disease, stroke, and diabetes.",
    bodyMarkdown: `## Overview
Metabolic syndrome is not a single disease but a group of interrelated risk factors that significantly increase the likelihood of cardiovascular disease, type 2 diabetes, and stroke. A diagnosis requires at least three of five criteria.

## Symptoms
Metabolic syndrome typically has no obvious symptoms on its own. The conditions associated with it (high blood pressure, high blood sugar, excess abdominal fat) are often identified through routine screenings.

## Causes
The underlying causes are closely linked to insulin resistance, obesity (particularly central obesity), physical inactivity, and genetic factors. Aging, hormonal changes, and chronic inflammation also play roles.

## Treatment
Treatment focuses on addressing each component: weight loss through diet and exercise, medications for blood pressure, blood sugar, and cholesterol as needed, and smoking cessation if applicable.

## Prevention
Lifestyle modifications are the cornerstone: maintaining a healthy weight, engaging in regular physical activity (at least 150 minutes per week), eating a balanced diet rich in whole foods, managing stress, and getting adequate sleep.

## When to seek care
If you know you have at least one component of metabolic syndrome, consult your healthcare provider about screening for the others. Regular check-ups are essential for early detection and management.`,
    confidenceLabel: "MODERATE",
    trustScore: 82,
    evidenceScore: 84,
    freshnessScore: 79,
    consensusScore: 81,
    tags: ["metabolic", "cardiovascular", "chronic disease", "prevention"],
    entities: ["metabolic syndrome", "insulin resistance", "central obesity", "dyslipidemia"],
    keyFacts: [
      "About one-third of US adults have metabolic syndrome.",
      "Having metabolic syndrome doubles the risk of cardiovascular disease.",
      "Lifestyle changes can reverse metabolic syndrome in many cases.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "NIH - Metabolic Syndrome", url: "https://www.nhlbi.nih.gov/health/metabolic-syndrome", sourceType: "government" },
      { title: "MedlinePlus - Metabolic Syndrome", url: "https://medlineplus.gov/metabolicsyndrome.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.87, reason: "Metabolic syndrome is a precursor to and overlaps with type 2 diabetes." },
      { slug: "obesity", title: "Obesity", score: 0.85, reason: "Central obesity is a core criterion of metabolic syndrome." },
      { slug: "hypertension", title: "Hypertension", score: 0.80, reason: "Elevated blood pressure is a key component of metabolic syndrome." },
      { slug: "hyperlipidemia", title: "Hyperlipidemia", score: 0.78, reason: "Abnormal cholesterol levels are a defining criterion." },
    ],
  },
  {
    slug: "hyperlipidemia",
    title: "Hyperlipidemia",
    summary:
      "Hyperlipidemia is an abnormally high level of fats (lipids) in the blood, including cholesterol and triglycerides, which significantly increases the risk of cardiovascular disease.",
    bodyMarkdown: `## Overview
Hyperlipidemia refers to elevated levels of lipids in the blood, including total cholesterol, LDL cholesterol, and triglycerides. It is a major risk factor for atherosclerosis and cardiovascular disease.

## Symptoms
Hyperlipidemia typically causes no symptoms. It is usually detected through routine blood tests (lipid panel). In severe cases, cholesterol deposits may appear as yellowish patches around the eyes or as nodules on tendons.

## Causes
Causes include genetic factors (familial hypercholesterolemia), diet high in saturated and trans fats, physical inactivity, obesity, diabetes, hypothyroidism, kidney disease, and certain medications.

## Treatment
Treatment begins with lifestyle modifications: heart-healthy diet, regular exercise, weight management, and smoking cessation. Medications include statins, ezetimibe, PCSK9 inhibitors, fibrates, and omega-3 fatty acids.

## Prevention
Eat a diet low in saturated fat and cholesterol, exercise regularly, maintain a healthy weight, avoid tobacco, and have regular lipid screening starting at age 20.

## When to seek care
Get regular lipid screenings as recommended by your healthcare provider. Seek care if you have a family history of high cholesterol or premature heart disease.`,
    confidenceLabel: "HIGH",
    trustScore: 86,
    evidenceScore: 88,
    freshnessScore: 82,
    consensusScore: 87,
    tags: ["metabolic", "cardiovascular", "pharmacotherapy", "prevention"],
    entities: ["hyperlipidemia", "LDL cholesterol", "statins", "triglycerides", "atherosclerosis"],
    keyFacts: [
      "Nearly 94 million US adults have total cholesterol levels above 200 mg/dL.",
      "Statins are the most widely prescribed medications for lowering LDL cholesterol.",
      "Lowering LDL cholesterol reduces the risk of heart attack and stroke.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "CDC - Cholesterol", url: "https://www.cdc.gov/cholesterol/about/index.html", sourceType: "government" },
      { title: "NIH - High Blood Cholesterol", url: "https://www.nhlbi.nih.gov/health/high-blood-cholesterol", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "coronary-artery-disease", title: "Coronary Artery Disease", score: 0.85, reason: "High cholesterol is a primary driver of atherosclerosis and CAD." },
      { slug: "metabolic-syndrome", title: "Metabolic Syndrome", score: 0.78, reason: "Dyslipidemia is a core component of metabolic syndrome." },
      { slug: "mediterranean-diet", title: "Mediterranean Diet", score: 0.70, reason: "Mediterranean diet has strong evidence for improving lipid profiles." },
    ],
  },

  /* ── Respiratory ────────────────────────────────────────────────── */
  {
    slug: "asthma",
    title: "Asthma",
    summary:
      "Asthma is a chronic respiratory condition in which the airways narrow and swell, producing extra mucus, making breathing difficult and triggering coughing, wheezing, and shortness of breath.",
    bodyMarkdown: `## Overview
Asthma is a chronic inflammatory disease of the airways characterized by variable and recurring symptoms, reversible airflow obstruction, and bronchospasm. It ranges from a minor nuisance to a life-threatening condition.

## Symptoms
Common symptoms include shortness of breath, chest tightness, wheezing (especially when exhaling), coughing (particularly at night or early morning), and trouble sleeping caused by breathing difficulties.

## Causes
The exact cause is unknown but involves a combination of genetic and environmental factors. Common triggers include allergens (dust mites, pollen, pet dander), respiratory infections, exercise, cold air, air pollutants, stress, and certain medications.

## Treatment
Treatment includes long-term control medications (inhaled corticosteroids, long-acting beta-agonists, leukotriene modifiers) and quick-relief medications (short-acting beta-agonists). Biologic therapies are available for severe asthma.

## Prevention
Identify and avoid triggers, follow your asthma action plan, take long-term control medications as prescribed, get vaccinated against influenza and pneumonia, monitor your breathing, and keep indoor air clean.

## When to seek care
Seek emergency care if your quick-relief inhaler doesn't help, you have severe shortness of breath with minimal activity, or your symptoms rapidly worsen.`,
    confidenceLabel: "HIGH",
    trustScore: 89,
    evidenceScore: 91,
    freshnessScore: 85,
    consensusScore: 89,
    tags: ["respiratory", "chronic disease", "inflammation", "pharmacotherapy"],
    entities: ["asthma", "bronchospasm", "inhaled corticosteroids", "bronchodilators"],
    keyFacts: [
      "Asthma affects approximately 25 million Americans.",
      "It is the leading chronic disease in children.",
      "Proper management allows most people with asthma to live active lives.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Asthma", url: "https://www.who.int/news-room/fact-sheets/detail/asthma", sourceType: "public-health" },
      { title: "CDC - Asthma", url: "https://www.cdc.gov/asthma/default.htm", sourceType: "government" },
      { title: "NIH - Asthma", url: "https://www.nhlbi.nih.gov/health/asthma", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "copd", title: "COPD", score: 0.80, reason: "Both are chronic obstructive airway diseases with overlapping features." },
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.60, reason: "Exercise-induced bronchoconstriction is common in asthma patients." },
    ],
  },
  {
    slug: "copd",
    title: "Chronic Obstructive Pulmonary Disease (COPD)",
    summary:
      "COPD is a chronic inflammatory lung disease that causes obstructed airflow from the lungs, primarily caused by long-term exposure to irritating gases or particulate matter, most often cigarette smoke.",
    bodyMarkdown: `## Overview
COPD is a progressive lung disease that includes chronic bronchitis and emphysema. It makes breathing increasingly difficult over time and is a major cause of disability and death worldwide.

## Symptoms
Symptoms often don't appear until significant lung damage has occurred. They include shortness of breath (especially during physical activity), chronic cough with mucus production, wheezing, chest tightness, frequent respiratory infections, fatigue, and unintended weight loss.

## Causes
The primary cause is long-term cigarette smoking. Other risk factors include exposure to secondhand smoke, air pollution, occupational dusts and chemicals, genetic factors (alpha-1 antitrypsin deficiency), and a history of frequent childhood respiratory infections.

## Treatment
COPD has no cure, but treatment can help control symptoms and slow progression. Options include bronchodilators, inhaled corticosteroids, combination inhalers, oral steroids, phosphodiesterase-4 inhibitors, antibiotics, oxygen therapy, and pulmonary rehabilitation.

## Prevention
The most effective prevention is never smoking or stopping smoking as soon as possible. Avoid exposure to secondhand smoke and occupational hazards. Get vaccinated against influenza and pneumococcal disease.

## When to seek care
Seek immediate care if you can't catch your breath, have severe bluish discoloration of your lips or fingernails, have a rapid heartbeat, or feel foggy and have trouble concentrating.`,
    confidenceLabel: "HIGH",
    trustScore: 90,
    evidenceScore: 92,
    freshnessScore: 86,
    consensusScore: 90,
    tags: ["respiratory", "chronic disease", "inflammation", "prevention"],
    entities: ["COPD", "emphysema", "chronic bronchitis", "spirometry", "bronchodilators"],
    keyFacts: [
      "COPD is the third leading cause of death worldwide.",
      "Smoking is responsible for about 85-90% of COPD cases.",
      "Early diagnosis and quitting smoking can slow disease progression.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - COPD", url: "https://www.who.int/news-room/fact-sheets/detail/chronic-obstructive-pulmonary-disease-(copd)", sourceType: "public-health" },
      { title: "NIH - COPD", url: "https://www.nhlbi.nih.gov/health/copd", sourceType: "government" },
      { title: "MedlinePlus - COPD", url: "https://medlineplus.gov/copd.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "smoking-cessation", title: "Smoking Cessation", score: 0.90, reason: "Quitting smoking is the most important intervention for COPD." },
      { slug: "asthma", title: "Asthma", score: 0.80, reason: "Both are chronic obstructive airway diseases with overlapping features." },
      { slug: "pneumonia", title: "Pneumonia", score: 0.72, reason: "COPD patients are at higher risk for pneumonia." },
    ],
  },
  {
    slug: "pneumonia",
    title: "Pneumonia",
    summary:
      "Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus, causing cough, fever, chills, and difficulty breathing.",
    bodyMarkdown: `## Overview
Pneumonia is an infection of the lungs that can range from mild to severe. It can be caused by bacteria, viruses, or fungi. Community-acquired pneumonia is the most common type.

## Symptoms
Symptoms vary from mild to severe and include cough (often with phlegm), fever, sweating, chills, shortness of breath, chest pain with breathing or coughing, fatigue, nausea, vomiting, and diarrhea.

## Causes
The most common cause is bacterial infection (Streptococcus pneumoniae). Viral causes include influenza and SARS-CoV-2. Risk factors include age (very young or elderly), chronic lung disease, weakened immune system, smoking, and hospitalization.

## Treatment
Bacterial pneumonia is treated with antibiotics. Viral pneumonia may be treated with antiviral medications. Supportive care includes rest, fluids, fever reducers, and in severe cases, hospitalization with oxygen therapy or mechanical ventilation.

## Prevention
Get vaccinated (pneumococcal and influenza vaccines), practice good hand hygiene, don't smoke, keep your immune system strong through adequate sleep, regular exercise, and healthy nutrition.

## When to seek care
Seek medical attention if you have difficulty breathing, chest pain, persistent fever of 102°F (39°C) or higher, or persistent cough, especially if you're coughing up pus. Older adults and people with chronic conditions should seek early care.`,
    confidenceLabel: "MODERATE",
    trustScore: 83,
    evidenceScore: 85,
    freshnessScore: 80,
    consensusScore: 82,
    tags: ["respiratory", "inflammation", "prevention"],
    entities: ["pneumonia", "Streptococcus pneumoniae", "antibiotics", "pneumococcal vaccine"],
    keyFacts: [
      "Pneumonia is the leading infectious cause of death in children worldwide.",
      "Vaccines can prevent some of the most common causes of pneumonia.",
      "Most healthy adults recover from pneumonia in one to three weeks.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Pneumonia", url: "https://www.who.int/news-room/fact-sheets/detail/pneumonia", sourceType: "public-health" },
      { title: "CDC - Pneumonia", url: "https://www.cdc.gov/pneumonia/about/index.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "copd", title: "COPD", score: 0.72, reason: "COPD patients are at increased risk for pneumonia." },
      { slug: "asthma", title: "Asthma", score: 0.60, reason: "Respiratory infections can trigger asthma exacerbations." },
    ],
  },
  {
    slug: "sleep-apnea",
    title: "Sleep Apnea",
    summary:
      "Sleep apnea is a serious sleep disorder where breathing repeatedly stops and starts during sleep, leading to poor sleep quality and increased risk of cardiovascular disease.",
    bodyMarkdown: `## Overview
Sleep apnea is a condition in which breathing is repeatedly interrupted during sleep. The most common form, obstructive sleep apnea (OSA), occurs when throat muscles intermittently relax and block the airway. Central sleep apnea occurs when the brain doesn't send proper signals to muscles that control breathing.

## Symptoms
Common symptoms include loud snoring, episodes of stopped breathing during sleep (reported by another person), gasping for air during sleep, morning headache, excessive daytime sleepiness, difficulty concentrating, mood changes, and dry mouth upon awakening.

## Causes
Obstructive sleep apnea is caused by relaxation of muscles in the back of the throat. Risk factors include excess weight, neck circumference, narrowed airway, male sex, aging, family history, use of alcohol or sedatives, smoking, and nasal congestion.

## Treatment
Treatment options include CPAP (continuous positive airway pressure) therapy, oral appliances, positional therapy, weight loss, surgery in selected cases, and treatment of underlying conditions.

## Prevention
Maintain a healthy weight, exercise regularly, avoid alcohol and sedatives before bedtime, sleep on your side, treat nasal allergies, and quit smoking.

## When to seek care
Consult a doctor if you or your partner notices loud snoring with periods of silence, excessive daytime sleepiness, or morning headaches. Untreated sleep apnea increases risk of heart disease and stroke.`,
    confidenceLabel: "MODERATE",
    trustScore: 80,
    evidenceScore: 82,
    freshnessScore: 77,
    consensusScore: 79,
    tags: ["respiratory", "cardiovascular", "chronic disease", "lifestyle"],
    entities: ["sleep apnea", "obstructive sleep apnea", "CPAP", "polysomnography"],
    keyFacts: [
      "An estimated 22 million Americans suffer from sleep apnea.",
      "Up to 80% of moderate and severe OSA cases are undiagnosed.",
      "Untreated sleep apnea is associated with a higher risk of heart attack and stroke.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - Sleep Apnea", url: "https://www.nhlbi.nih.gov/health/sleep-apnea", sourceType: "government" },
      { title: "MedlinePlus - Sleep Apnea", url: "https://medlineplus.gov/sleepapnea.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "obesity", title: "Obesity", score: 0.82, reason: "Obesity is the strongest risk factor for obstructive sleep apnea." },
      { slug: "hypertension", title: "Hypertension", score: 0.75, reason: "Sleep apnea is an independent risk factor for hypertension." },
      { slug: "atrial-fibrillation", title: "Atrial Fibrillation", score: 0.68, reason: "Sleep apnea significantly increases AFib risk." },
      { slug: "insomnia", title: "Insomnia", score: 0.62, reason: "Sleep apnea and insomnia frequently co-occur." },
    ],
  },

  /* ── Mental Health ──────────────────────────────────────────────── */
  {
    slug: "major-depressive-disorder",
    title: "Major Depressive Disorder",
    summary:
      "Major depressive disorder is a common and serious mental health condition that negatively affects how you feel, think, and act, causing persistent sadness and loss of interest.",
    bodyMarkdown: `## Overview
Major depressive disorder (MDD) is more than just feeling sad. It is a serious mental health condition that causes persistent feelings of sadness, hopelessness, and loss of interest in activities once enjoyed. It affects daily functioning and quality of life.

## Symptoms
Symptoms must be present for at least two weeks and include persistent sad or empty mood, loss of interest or pleasure, changes in appetite or weight, sleep disturbances, fatigue, feelings of worthlessness or guilt, difficulty concentrating, and thoughts of death or suicide.

## Causes
MDD is caused by a complex interaction of biological, genetic, environmental, and psychological factors. Risk factors include family history, trauma, stressful life events, certain medications, chronic illness, and substance use.

## Treatment
Treatment typically involves a combination of psychotherapy (cognitive behavioral therapy, interpersonal therapy) and medications (SSRIs, SNRIs, or other antidepressants). Severe cases may benefit from electroconvulsive therapy or transcranial magnetic stimulation.

## Prevention
While not always preventable, strategies include regular exercise, adequate sleep, stress management, strong social connections, limiting alcohol, seeking early treatment, and maintaining a routine.

## When to seek care
Seek immediate help if you or someone you know has thoughts of suicide. Call 988 (Suicide and Crisis Lifeline) or go to the nearest emergency room. Contact a healthcare provider if depressive symptoms persist for more than two weeks.`,
    confidenceLabel: "HIGH",
    trustScore: 91,
    evidenceScore: 93,
    freshnessScore: 87,
    consensusScore: 90,
    tags: ["mental health", "chronic disease", "pharmacotherapy"],
    entities: ["major depressive disorder", "SSRIs", "cognitive behavioral therapy", "serotonin"],
    keyFacts: [
      "Depression is the leading cause of disability worldwide.",
      "About 21 million adults in the US had at least one depressive episode in 2020.",
      "Effective treatments exist, but fewer than half of those affected receive treatment.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Depression", url: "https://www.who.int/news-room/fact-sheets/detail/depression", sourceType: "public-health" },
      { title: "NIH - Depression", url: "https://www.nimh.nih.gov/health/topics/depression", sourceType: "government" },
      { title: "MedlinePlus - Depression", url: "https://medlineplus.gov/depression.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "generalized-anxiety-disorder", title: "Generalized Anxiety Disorder", score: 0.85, reason: "Depression and anxiety frequently co-occur." },
      { slug: "insomnia", title: "Insomnia", score: 0.75, reason: "Sleep disturbance is both a symptom of and risk factor for depression." },
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.65, reason: "Regular exercise has demonstrated antidepressant effects." },
    ],
  },
  {
    slug: "generalized-anxiety-disorder",
    title: "Generalized Anxiety Disorder",
    summary:
      "Generalized anxiety disorder involves persistent and excessive worry about various aspects of daily life that is difficult to control and interferes with functioning.",
    bodyMarkdown: `## Overview
Generalized anxiety disorder (GAD) is characterized by chronic, exaggerated worry and tension that is unfounded or much more severe than the normal anxiety most people experience. People with GAD can't stop worrying even when they know the anxiety is excessive.

## Symptoms
Symptoms include persistent worrying, inability to relax, difficulty concentrating, restlessness, irritability, muscle tension, sleep problems, fatigue, trembling, being easily startled, sweating, nausea, and headaches.

## Causes
The exact cause is not fully understood but involves a combination of biological factors, brain chemistry, genetics, life experiences, and personality traits. Stressful or traumatic events may trigger or worsen GAD.

## Treatment
Treatment includes psychotherapy (especially cognitive behavioral therapy), medications (SSRIs, SNRIs, buspirone, benzodiazepines for short-term use), and self-management strategies such as relaxation techniques and mindfulness.

## Prevention
While not entirely preventable, early intervention, stress management, regular exercise, adequate sleep, limiting caffeine and alcohol, and building strong social connections can help reduce risk and severity.

## When to seek care
Seek help when anxiety interferes with your daily life, work, or relationships. Seek immediate help if anxiety is accompanied by thoughts of self-harm or substance misuse.`,
    confidenceLabel: "HIGH",
    trustScore: 87,
    evidenceScore: 89,
    freshnessScore: 84,
    consensusScore: 86,
    tags: ["mental health", "chronic disease", "pharmacotherapy"],
    entities: ["generalized anxiety disorder", "cognitive behavioral therapy", "SSRIs", "buspirone"],
    keyFacts: [
      "GAD affects about 6.8 million adults in the US.",
      "Women are twice as likely to be affected as men.",
      "GAD often co-occurs with depression and other anxiety disorders.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - Anxiety Disorders", url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders", sourceType: "government" },
      { title: "MedlinePlus - Anxiety", url: "https://medlineplus.gov/anxiety.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.85, reason: "GAD and depression frequently co-occur." },
      { slug: "insomnia", title: "Insomnia", score: 0.72, reason: "Anxiety is a leading cause of chronic insomnia." },
      { slug: "ptsd", title: "PTSD", score: 0.70, reason: "Anxiety disorders share common neurobiological pathways." },
    ],
  },
  {
    slug: "ptsd",
    title: "Post-Traumatic Stress Disorder (PTSD)",
    summary:
      "PTSD is a mental health condition triggered by experiencing or witnessing a terrifying event, causing flashbacks, nightmares, severe anxiety, and uncontrollable thoughts about the event.",
    bodyMarkdown: `## Overview
Post-traumatic stress disorder (PTSD) is a condition that develops in some people who have experienced a shocking, scary, or dangerous event. It is a lasting consequence of traumatic ordeals that cause intense fear, helplessness, or horror.

## Symptoms
Symptoms are grouped into four categories: intrusive memories (flashbacks, nightmares, distressing recollections), avoidance (avoiding places, people, or activities related to trauma), negative changes in thinking and mood (hopelessness, emotional numbness, detachment), and changes in physical and emotional reactions (hyperarousal, being easily startled, irritability, trouble sleeping).

## Causes
PTSD can develop after exposure to a traumatic event such as combat, sexual assault, natural disaster, serious accident, or childhood abuse. Risk factors include the intensity and duration of trauma, prior trauma, lack of social support, family history of mental illness, and substance misuse.

## Treatment
Evidence-based treatments include trauma-focused cognitive behavioral therapy, prolonged exposure therapy, cognitive processing therapy, eye movement desensitization and reprocessing (EMDR), and medications (SSRIs such as sertraline and paroxetine).

## Prevention
Early psychological intervention after trauma, strong social support, resilience-building skills, and professional debriefing may help reduce the risk of developing PTSD.

## When to seek care
Seek help if symptoms last more than a month, cause significant distress, or interfere with daily functioning. Seek immediate help if you have thoughts of harming yourself or others.`,
    confidenceLabel: "MODERATE",
    trustScore: 83,
    evidenceScore: 86,
    freshnessScore: 79,
    consensusScore: 82,
    tags: ["mental health", "inflammation"],
    entities: ["PTSD", "EMDR", "trauma", "prolonged exposure therapy", "SSRIs"],
    keyFacts: [
      "About 6 out of every 100 people will experience PTSD at some point.",
      "Women are about twice as likely as men to develop PTSD.",
      "Effective evidence-based treatments can significantly reduce symptoms.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "NIH - PTSD", url: "https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd", sourceType: "government" },
      { title: "MedlinePlus - PTSD", url: "https://medlineplus.gov/posttraumaticstressdisorder.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.78, reason: "PTSD and depression frequently co-occur." },
      { slug: "generalized-anxiety-disorder", title: "Generalized Anxiety Disorder", score: 0.75, reason: "PTSD shares anxiety pathways with GAD." },
      { slug: "insomnia", title: "Insomnia", score: 0.70, reason: "Sleep disturbance is a hallmark symptom of PTSD." },
    ],
  },
  {
    slug: "insomnia",
    title: "Insomnia",
    summary:
      "Insomnia is a common sleep disorder characterized by difficulty falling asleep, staying asleep, or waking too early and not being able to get back to sleep.",
    bodyMarkdown: `## Overview
Insomnia is the most common sleep disorder, affecting both sleep quality and quantity. It can be short-term (acute) or long-term (chronic). Chronic insomnia occurs at least three nights per week for three months or more.

## Symptoms
Symptoms include difficulty falling asleep, waking up during the night, waking up too early, not feeling rested after sleep, daytime tiredness, irritability, difficulty concentrating, and increased errors or accidents.

## Causes
Insomnia can be caused by stress, anxiety, depression, poor sleep habits, irregular schedule, medications, caffeine, alcohol, chronic pain, and other medical conditions. It often co-occurs with mental health disorders.

## Treatment
Treatment includes cognitive behavioral therapy for insomnia (CBT-I), which is the first-line treatment, sleep hygiene improvements, stimulus control, sleep restriction therapy, relaxation techniques, and in some cases, short-term use of sleep medications.

## Prevention
Maintain a regular sleep schedule, create a restful environment, limit screen time before bed, avoid caffeine and alcohol in the evening, exercise regularly (but not too close to bedtime), and manage stress through relaxation techniques.

## When to seek care
See a healthcare provider if insomnia makes it hard to function during the day, lasts more than a few weeks, or occurs alongside other concerning symptoms.`,
    confidenceLabel: "MODERATE",
    trustScore: 79,
    evidenceScore: 81,
    freshnessScore: 76,
    consensusScore: 78,
    tags: ["mental health", "chronic disease", "lifestyle"],
    entities: ["insomnia", "CBT-I", "sleep hygiene", "melatonin"],
    keyFacts: [
      "About 30% of adults report short-term insomnia symptoms.",
      "Cognitive behavioral therapy for insomnia (CBT-I) is more effective long-term than medication.",
      "Chronic insomnia increases the risk of depression, anxiety, and cardiovascular disease.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - Insomnia", url: "https://www.nhlbi.nih.gov/health/insomnia", sourceType: "government" },
      { title: "MedlinePlus - Insomnia", url: "https://medlineplus.gov/insomnia.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.75, reason: "Insomnia and depression have a bidirectional relationship." },
      { slug: "generalized-anxiety-disorder", title: "Generalized Anxiety Disorder", score: 0.72, reason: "Anxiety is a leading cause of chronic insomnia." },
      { slug: "sleep-apnea", title: "Sleep Apnea", score: 0.62, reason: "Insomnia and sleep apnea frequently co-occur." },
    ],
  },

  /* ── Musculoskeletal ────────────────────────────────────────────── */
  {
    slug: "osteoarthritis",
    title: "Osteoarthritis",
    summary:
      "Osteoarthritis is the most common form of arthritis, caused by wear-and-tear damage to joint cartilage, leading to pain, stiffness, and reduced mobility.",
    bodyMarkdown: `## Overview
Osteoarthritis (OA) is a degenerative joint disease in which the protective cartilage that cushions the ends of bones wears down over time. It most commonly affects joints in the hands, knees, hips, and spine.

## Symptoms
Symptoms develop slowly and worsen over time. They include joint pain during or after movement, stiffness (especially in the morning or after inactivity), tenderness, loss of flexibility, grating sensation, bone spurs, and swelling.

## Causes
OA occurs when the cartilage that cushions bones at joints gradually deteriorates. Risk factors include aging, obesity, joint injuries, repetitive stress on joints, genetics, bone deformities, certain metabolic diseases, and female sex.

## Treatment
There is no cure for OA, but treatments can reduce pain and improve function. Options include exercise, weight management, physical therapy, pain medications (acetaminophen, NSAIDs), corticosteroid injections, hyaluronic acid injections, and joint replacement surgery.

## Prevention
Maintain a healthy weight, stay physically active, avoid joint injuries, strengthen muscles around joints, use proper body mechanics, and manage other conditions that may worsen OA.

## When to seek care
See a doctor if you have persistent joint pain, stiffness, or swelling that interferes with daily activities. Seek care if joint symptoms suddenly worsen.`,
    confidenceLabel: "HIGH",
    trustScore: 85,
    evidenceScore: 87,
    freshnessScore: 82,
    consensusScore: 84,
    tags: ["musculoskeletal", "chronic disease", "inflammation"],
    entities: ["osteoarthritis", "cartilage", "NSAIDs", "joint replacement"],
    keyFacts: [
      "OA affects over 32.5 million adults in the US.",
      "It is the most common cause of disability among older adults.",
      "Weight loss of just 10% can significantly reduce knee OA pain.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "CDC - Osteoarthritis", url: "https://www.cdc.gov/osteoarthritis/about/index.html", sourceType: "government" },
      { title: "NIH - Osteoarthritis", url: "https://www.niams.nih.gov/health-topics/osteoarthritis", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "rheumatoid-arthritis", title: "Rheumatoid Arthritis", score: 0.75, reason: "Both are forms of arthritis but with different underlying mechanisms." },
      { slug: "obesity", title: "Obesity", score: 0.72, reason: "Excess weight is a major modifiable risk factor for OA." },
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.68, reason: "Regular exercise is a cornerstone of OA management." },
    ],
  },
  {
    slug: "osteoporosis",
    title: "Osteoporosis",
    summary:
      "Osteoporosis is a bone disease that occurs when the body loses too much bone or makes too little, making bones weak and more likely to break.",
    bodyMarkdown: `## Overview
Osteoporosis causes bones to become weak and brittle — so brittle that a fall or even mild stresses such as bending over or coughing can cause a fracture. Osteoporosis-related fractures most commonly occur in the hip, wrist, or spine.

## Symptoms
Osteoporosis is often called a "silent disease" because bone loss occurs without symptoms. Signs may include back pain, loss of height over time, a stooped posture, and bones that break much more easily than expected.

## Causes
Bones are constantly being renewed — new bone is made and old bone is broken down. Osteoporosis occurs when the creation of new bone doesn't keep up with removal of old bone. Risk factors include age, female sex, menopause, low body weight, family history, low calcium and vitamin D intake, sedentary lifestyle, smoking, and excessive alcohol.

## Treatment
Treatment includes medications (bisphosphonates, denosumab, teriparatide, romosozumab), calcium and vitamin D supplementation, weight-bearing exercise, and fall prevention strategies.

## Prevention
Get enough calcium and vitamin D, do regular weight-bearing and muscle-strengthening exercises, avoid smoking and excessive alcohol, have bone density testing as recommended, and consider fall prevention measures in the home.

## When to seek care
Talk to your doctor about bone density testing if you are over 50, have gone through menopause, or have other risk factors. Seek immediate care for any suspected fracture.`,
    confidenceLabel: "MODERATE",
    trustScore: 82,
    evidenceScore: 84,
    freshnessScore: 79,
    consensusScore: 81,
    tags: ["musculoskeletal", "chronic disease", "prevention", "nutrition"],
    entities: ["osteoporosis", "bone density", "bisphosphonates", "calcium", "vitamin D"],
    keyFacts: [
      "About 10 million Americans have osteoporosis and 44 million have low bone density.",
      "One in two women and one in four men over 50 will break a bone due to osteoporosis.",
      "Osteoporosis is largely preventable with proper nutrition and exercise.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - Osteoporosis", url: "https://www.niams.nih.gov/health-topics/osteoporosis", sourceType: "government" },
      { title: "MedlinePlus - Osteoporosis", url: "https://medlineplus.gov/osteoporosis.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.72, reason: "Weight-bearing exercise is essential for bone health." },
      { slug: "mediterranean-diet", title: "Mediterranean Diet", score: 0.58, reason: "A nutrient-rich diet supports bone density maintenance." },
    ],
  },
  {
    slug: "rheumatoid-arthritis",
    title: "Rheumatoid Arthritis",
    summary:
      "Rheumatoid arthritis is a chronic autoimmune disorder that primarily affects joints, causing painful swelling that can eventually result in joint deformity and bone erosion.",
    bodyMarkdown: `## Overview
Rheumatoid arthritis (RA) is an autoimmune disease in which the immune system mistakenly attacks the body's own joint tissues. Unlike osteoarthritis, RA affects the lining of joints, causing painful swelling that can lead to bone erosion and joint deformity.

## Symptoms
Symptoms include tender, warm, swollen joints, joint stiffness (especially in the morning or after inactivity), fatigue, fever, and loss of appetite. RA usually affects smaller joints first, particularly the fingers and toes, and often affects the same joints on both sides of the body.

## Causes
RA is an autoimmune disease. The exact cause is unknown, but risk factors include genetics, female sex, age (most commonly begins between ages 30-60), smoking, obesity, and environmental exposures.

## Treatment
While there's no cure, early aggressive treatment can help control symptoms and prevent joint damage. Treatment includes DMARDs (disease-modifying antirheumatic drugs), biologic agents, JAK inhibitors, corticosteroids, physical therapy, and in severe cases, surgery.

## Prevention
There is no known way to prevent RA, but early diagnosis and treatment can significantly reduce joint damage. Avoiding smoking and maintaining a healthy weight may reduce risk in genetically susceptible individuals.

## When to seek care
See a doctor if you have persistent joint swelling, pain, or stiffness, especially if it's symmetrical and worse in the morning. Early treatment within the first two years can prevent irreversible joint damage.`,
    confidenceLabel: "MODERATE",
    trustScore: 84,
    evidenceScore: 86,
    freshnessScore: 81,
    consensusScore: 83,
    tags: ["musculoskeletal", "inflammation", "chronic disease", "pharmacotherapy"],
    entities: ["rheumatoid arthritis", "autoimmune", "DMARDs", "biologics", "joint erosion"],
    keyFacts: [
      "RA affects about 1.3 million Americans.",
      "Early treatment within the first 2 years can prevent irreversible joint damage.",
      "RA can also affect organs including the lungs, heart, and eyes.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "NIH - Rheumatoid Arthritis", url: "https://www.niams.nih.gov/health-topics/rheumatoid-arthritis", sourceType: "government" },
      { title: "CDC - Rheumatoid Arthritis", url: "https://www.cdc.gov/arthritis/about/rheumatoid-arthritis.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "osteoarthritis", title: "Osteoarthritis", score: 0.75, reason: "Both cause joint pain but RA is autoimmune while OA is degenerative." },
      { slug: "osteoporosis", title: "Osteoporosis", score: 0.60, reason: "RA and its treatments can contribute to bone loss." },
    ],
  },

  /* ── Neurological ───────────────────────────────────────────────── */
  {
    slug: "migraine",
    title: "Migraine",
    summary:
      "Migraine is a neurological condition that causes intense, debilitating headaches, often accompanied by nausea, vomiting, and extreme sensitivity to light and sound.",
    bodyMarkdown: `## Overview
Migraine is a complex neurological disorder characterized by recurrent episodes of moderate to severe headaches, typically on one side of the head. It is often accompanied by sensory disturbances (aura) and can be disabling.

## Symptoms
Symptoms progress through phases: prodrome (mood changes, food cravings, neck stiffness), aura (visual disturbances, tingling), headache (throbbing pain, nausea, vomiting, light and sound sensitivity), and postdrome (fatigue, confusion).

## Causes
The exact cause is not fully understood but involves changes in brain activity affecting nerve signals, chemicals, and blood vessels. Triggers include stress, hormonal changes, certain foods, sleep disruption, weather changes, sensory stimuli, and physical exertion.

## Treatment
Acute treatments include triptans, NSAIDs, and gepants. Preventive treatments include beta-blockers, antidepressants, anticonvulsants, CGRP monoclonal antibodies, and Botox. Lifestyle modifications and trigger avoidance are important adjuncts.

## Prevention
Keep a headache diary to identify triggers, maintain regular sleep patterns, stay hydrated, eat regularly, manage stress, exercise regularly, and avoid known triggers.

## When to seek care
Seek emergency care for a sudden severe headache ("thunderclap"), headache with fever and stiff neck, headache after head injury, or a headache that is dramatically different from your usual pattern.`,
    confidenceLabel: "HIGH",
    trustScore: 86,
    evidenceScore: 88,
    freshnessScore: 83,
    consensusScore: 85,
    tags: ["neurological", "chronic disease", "pharmacotherapy"],
    entities: ["migraine", "aura", "triptans", "CGRP antibodies"],
    keyFacts: [
      "Migraine affects about 12% of the population worldwide.",
      "It is three times more common in women than men.",
      "New preventive treatments (CGRP inhibitors) have transformed migraine management.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Headache Disorders", url: "https://www.who.int/news-room/fact-sheets/detail/headache-disorders", sourceType: "public-health" },
      { title: "NIH - Migraine", url: "https://www.ninds.nih.gov/health-information/disorders/migraine", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.62, reason: "Migraine and depression frequently co-occur." },
      { slug: "insomnia", title: "Insomnia", score: 0.58, reason: "Poor sleep is both a trigger and consequence of migraine." },
      { slug: "epilepsy", title: "Epilepsy", score: 0.55, reason: "Some anticonvulsants are used in both migraine and epilepsy prevention." },
    ],
  },
  {
    slug: "epilepsy",
    title: "Epilepsy",
    summary:
      "Epilepsy is a neurological disorder characterized by recurrent, unprovoked seizures caused by abnormal electrical activity in the brain.",
    bodyMarkdown: `## Overview
Epilepsy is one of the most common neurological disorders, affecting people of all ages. It is characterized by a tendency to have recurrent seizures. A diagnosis typically requires at least two unprovoked seizures or one seizure with a high probability of recurrence.

## Symptoms
The primary symptom is recurrent seizures. Types include focal seizures (affecting one part of the brain) and generalized seizures (affecting both sides). Symptoms vary widely: staring spells, uncontrollable jerking movements, loss of consciousness, confusion, psychic symptoms, and temporary loss of awareness.

## Causes
Causes include genetic factors, brain injury, infection (meningitis, encephalitis), developmental disorders, prenatal injury, and stroke. In about half of cases, the cause is unknown. Risk factors include family history, head trauma, stroke, dementia, and brain infections.

## Treatment
Treatment usually begins with antiseizure medications. Options include levetiracetam, lamotrigine, valproate, carbamazepine, and many others. Surgery, vagus nerve stimulation, ketogenic diet, and responsive neurostimulation are options for drug-resistant epilepsy.

## Prevention
Prevent head injuries, manage cardiovascular risk factors, get prenatal care, control infections, and maintain overall health to reduce epilepsy risk.

## When to seek care
Call emergency services if a seizure lasts more than five minutes, the person doesn't regain consciousness, a second seizure follows immediately, the person is injured during the seizure, or it is a first-time seizure.`,
    confidenceLabel: "MODERATE",
    trustScore: 81,
    evidenceScore: 83,
    freshnessScore: 78,
    consensusScore: 80,
    tags: ["neurological", "chronic disease", "pharmacotherapy"],
    entities: ["epilepsy", "seizures", "antiseizure medications", "EEG", "levetiracetam"],
    keyFacts: [
      "About 3.4 million people in the US have epilepsy.",
      "Two-thirds of people with epilepsy can achieve seizure freedom with proper treatment.",
      "Epilepsy can develop at any age but most commonly starts in children and older adults.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Epilepsy", url: "https://www.who.int/news-room/fact-sheets/detail/epilepsy", sourceType: "public-health" },
      { title: "CDC - Epilepsy", url: "https://www.cdc.gov/epilepsy/about/index.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "migraine", title: "Migraine", score: 0.55, reason: "Migraine and epilepsy share some treatment approaches and comorbidity." },
      { slug: "alzheimers-disease", title: "Alzheimer's Disease", score: 0.50, reason: "Seizures are more common in people with Alzheimer's disease." },
    ],
  },
  {
    slug: "alzheimers-disease",
    title: "Alzheimer's Disease",
    summary:
      "Alzheimer's disease is a progressive neurological disorder that causes the brain to shrink and brain cells to die, leading to a continuous decline in thinking, behavioral, and social skills.",
    bodyMarkdown: `## Overview
Alzheimer's disease is the most common cause of dementia — a continuous decline in thinking, behavioral, and social skills that affects a person's ability to function independently. It progressively destroys memory and other important mental functions.

## Symptoms
Early signs include forgetting recent events or conversations. As the disease advances, symptoms include severe memory impairment, disorientation, mood and behavior changes, confusion about events and time, unfounded suspicions, difficulty speaking, swallowing, and walking.

## Causes
The exact cause is not fully understood but involves brain proteins that fail to function normally, disrupting neuron communication and triggering cell death. Risk factors include age (greatest risk factor), family history, genetics (APOE e4), Down syndrome, head trauma, cardiovascular risk factors, and limited social engagement.

## Treatment
There is no cure. Medications include cholinesterase inhibitors (donepezil, rivastigmine), memantine, and newer anti-amyloid antibodies (lecanemab, aducanumab). Supportive care, structured environment, and caregiver support are essential.

## Prevention
While not fully preventable, risk reduction includes regular physical exercise, a heart-healthy diet, cognitive stimulation, social engagement, quality sleep, managing cardiovascular risk factors, and protecting against head injury.

## When to seek care
Seek evaluation if you notice persistent memory problems, difficulty with daily tasks, personality changes, or confusion in a family member. Early diagnosis allows access to treatments and planning.`,
    confidenceLabel: "MODERATE",
    trustScore: 80,
    evidenceScore: 82,
    freshnessScore: 77,
    consensusScore: 79,
    tags: ["neurological", "chronic disease", "prevention"],
    entities: ["Alzheimer's disease", "dementia", "amyloid plaques", "cholinesterase inhibitors", "tau protein"],
    keyFacts: [
      "Alzheimer's disease affects more than 6 million Americans.",
      "It is the sixth leading cause of death in the US.",
      "Risk increases significantly after age 65, doubling about every five years.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "WHO - Dementia", url: "https://www.who.int/news-room/fact-sheets/detail/dementia", sourceType: "public-health" },
      { title: "NIH - Alzheimer's Disease", url: "https://www.nia.nih.gov/health/alzheimers-and-dementia", sourceType: "government" },
      { title: "MedlinePlus - Alzheimer's Disease", url: "https://medlineplus.gov/alzheimersdisease.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.62, reason: "Regular physical exercise may reduce risk of cognitive decline." },
      { slug: "mediterranean-diet", title: "Mediterranean Diet", score: 0.58, reason: "Mediterranean diet is associated with lower dementia risk." },
      { slug: "epilepsy", title: "Epilepsy", score: 0.50, reason: "People with Alzheimer's have increased seizure risk." },
    ],
  },

  /* ── GI / Renal ─────────────────────────────────────────────────── */
  {
    slug: "gerd",
    title: "Gastroesophageal Reflux Disease (GERD)",
    summary:
      "GERD is a chronic digestive disorder in which stomach acid or bile flows back into the esophagus, irritating its lining and causing heartburn and other symptoms.",
    bodyMarkdown: `## Overview
Gastroesophageal reflux disease (GERD) occurs when stomach acid frequently flows back into the esophagus. This backwash (acid reflux) can irritate the lining of the esophagus and lead to complications if left untreated.

## Symptoms
Common symptoms include heartburn (burning sensation in the chest, usually after eating), regurgitation of food or sour liquid, difficulty swallowing, chest pain, sensation of a lump in the throat, chronic cough, laryngitis, and disrupted sleep.

## Causes
GERD is caused by frequent acid reflux. The lower esophageal sphincter (LES) normally closes after food passes into the stomach. When it weakens or relaxes abnormally, stomach acid flows back. Risk factors include obesity, hiatal hernia, pregnancy, smoking, eating large meals, late-night eating, and certain foods and medications.

## Treatment
Treatment includes lifestyle modifications, over-the-counter antacids, H2 receptor blockers (famotidine), proton pump inhibitors (omeprazole, lansoprazole), and in refractory cases, surgical procedures like fundoplication.

## Prevention
Maintain a healthy weight, eat smaller meals, avoid trigger foods (spicy, fatty, acidic), don't lie down after eating, elevate the head of your bed, quit smoking, and avoid tight-fitting clothing around the waist.

## When to seek care
Seek care if you have frequent heartburn (more than twice a week), difficulty swallowing, persistent nausea or vomiting, or weight loss due to poor appetite or difficulty eating. Seek emergency care for severe chest pain.`,
    confidenceLabel: "MODERATE",
    trustScore: 78,
    evidenceScore: 80,
    freshnessScore: 75,
    consensusScore: 77,
    tags: ["gastrointestinal", "chronic disease", "lifestyle"],
    entities: ["GERD", "acid reflux", "proton pump inhibitors", "lower esophageal sphincter"],
    keyFacts: [
      "GERD affects about 20% of the US population.",
      "Long-term untreated GERD can lead to Barrett's esophagus and esophageal cancer.",
      "Lifestyle modifications are the first line of treatment.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - GERD", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults", sourceType: "government" },
      { title: "MedlinePlus - GERD", url: "https://medlineplus.gov/gerd.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "obesity", title: "Obesity", score: 0.65, reason: "Excess weight increases abdominal pressure and GERD risk." },
      { slug: "irritable-bowel-syndrome", title: "Irritable Bowel Syndrome", score: 0.58, reason: "GERD and IBS frequently co-occur as functional GI disorders." },
    ],
  },
  {
    slug: "chronic-kidney-disease",
    title: "Chronic Kidney Disease",
    summary:
      "Chronic kidney disease (CKD) involves a gradual loss of kidney function over time. The kidneys filter wastes and excess fluids from the blood, and when damaged, waste can build up to dangerous levels.",
    bodyMarkdown: `## Overview
Chronic kidney disease is a long-term condition where the kidneys don't work as well as they should. It progresses through five stages based on glomerular filtration rate (GFR). Early stages may have no symptoms, but advanced CKD can lead to kidney failure requiring dialysis or transplantation.

## Symptoms
Early CKD often has no symptoms. As it progresses, symptoms include fatigue, swollen ankles and feet, puffy eyes, decreased appetite, muscle cramps, increased or decreased urination, difficulty concentrating, dry and itchy skin, and nausea.

## Causes
The two main causes are diabetes and high blood pressure. Other causes include glomerulonephritis, polycystic kidney disease, prolonged obstruction, recurrent kidney infections, and certain medications. Risk factors include age, family history, and race/ethnicity.

## Treatment
Treatment focuses on slowing progression and managing complications. Options include blood pressure control (ACE inhibitors, ARBs), blood sugar management, dietary changes (limiting sodium, potassium, phosphorus, protein), medications for complications, dialysis, and kidney transplantation.

## Prevention
Control blood pressure and blood sugar, maintain a healthy weight, eat a balanced diet low in sodium, don't smoke, limit NSAIDs and other nephrotoxic drugs, stay hydrated, and get regular check-ups if you have risk factors.

## When to seek care
See a doctor if you have signs of kidney problems, especially if you have diabetes or high blood pressure. Seek immediate care for significantly decreased urine output, severe swelling, or confusion.`,
    confidenceLabel: "HIGH",
    trustScore: 87,
    evidenceScore: 89,
    freshnessScore: 84,
    consensusScore: 86,
    tags: ["renal", "chronic disease", "prevention", "blood pressure"],
    entities: ["chronic kidney disease", "GFR", "dialysis", "ACE inhibitors", "kidney transplant"],
    keyFacts: [
      "CKD affects about 37 million US adults, and most don't know they have it.",
      "Diabetes and hypertension account for about 75% of new CKD cases.",
      "Early detection and treatment can slow or prevent kidney failure.",
    ],
    readingLevel: "intermediate",
    citations: [
      { title: "NIH - Chronic Kidney Disease", url: "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd", sourceType: "government" },
      { title: "CDC - Chronic Kidney Disease", url: "https://www.cdc.gov/kidney-disease/about/index.html", sourceType: "government" },
      { title: "MedlinePlus - Chronic Kidney Disease", url: "https://medlineplus.gov/chronickidneydisease.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "hypertension", title: "Hypertension", score: 0.85, reason: "Hypertension is both a cause and consequence of CKD." },
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.83, reason: "Diabetes is the leading cause of CKD." },
      { slug: "heart-failure", title: "Heart Failure", score: 0.70, reason: "CKD and heart failure share cardiorenal pathways." },
    ],
  },
  {
    slug: "irritable-bowel-syndrome",
    title: "Irritable Bowel Syndrome",
    summary:
      "Irritable bowel syndrome (IBS) is a common gastrointestinal disorder affecting the large intestine, causing cramping, abdominal pain, bloating, gas, and changes in bowel habits.",
    bodyMarkdown: `## Overview
Irritable bowel syndrome is a functional gastrointestinal disorder characterized by a group of symptoms that occur together, including abdominal pain and changes in bowel habits. It is classified as IBS with constipation (IBS-C), IBS with diarrhea (IBS-D), or mixed (IBS-M).

## Symptoms
Symptoms include abdominal pain or cramping (often related to bowel movements), bloating, gas, diarrhea, constipation, or alternating between both. Symptoms may be triggered by food, stress, or hormonal changes, and may worsen during menstruation.

## Causes
The exact cause is unknown but involves a combination of gut-brain interaction disturbances, intestinal muscle contractions, nervous system abnormalities, intestinal inflammation, changes in gut microflora, severe infections, and early life stress.

## Treatment
Treatment is individualized and may include dietary changes (low FODMAP diet), fiber supplements, medications (antispasmodics, laxatives, antidiarrheals, low-dose antidepressants, IBS-specific medications), probiotics, stress management, and cognitive behavioral therapy.

## Prevention
While IBS cannot be prevented, managing stress, eating regular balanced meals, staying hydrated, exercising regularly, and identifying and avoiding trigger foods can help reduce flare-ups.

## When to seek care
See a doctor if you have persistent changes in bowel habits or other IBS symptoms. Seek immediate care for weight loss, nighttime diarrhea, rectal bleeding, iron deficiency anemia, unexplained vomiting, or difficulty swallowing, as these suggest other conditions.`,
    confidenceLabel: "MODERATE",
    trustScore: 76,
    evidenceScore: 78,
    freshnessScore: 73,
    consensusScore: 75,
    tags: ["gastrointestinal", "chronic disease", "lifestyle", "mental health"],
    entities: ["irritable bowel syndrome", "FODMAP", "gut-brain axis", "antispasmodics"],
    keyFacts: [
      "IBS affects 10-15% of the worldwide population.",
      "It is more common in women and people under age 50.",
      "IBS does not cause permanent damage to the intestines or increase cancer risk.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - IBS", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome", sourceType: "government" },
      { title: "MedlinePlus - IBS", url: "https://medlineplus.gov/irritablebowelsyndrome.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "gerd", title: "GERD", score: 0.58, reason: "GERD and IBS frequently co-occur as functional GI disorders." },
      { slug: "generalized-anxiety-disorder", title: "Generalized Anxiety Disorder", score: 0.55, reason: "Anxiety and IBS are strongly linked through the gut-brain axis." },
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.50, reason: "Depression is common in IBS patients and worsens symptoms." },
    ],
  },

  /* ── Nutrition / Lifestyle ──────────────────────────────────────── */
  {
    slug: "dash-diet",
    title: "DASH Diet",
    summary:
      "The DASH (Dietary Approaches to Stop Hypertension) diet is an evidence-based eating plan designed to lower blood pressure and improve heart health through nutrient-rich foods.",
    bodyMarkdown: `## Overview
The DASH diet was developed by the National Heart, Lung, and Blood Institute (NHLBI) to help prevent and treat hypertension. It emphasizes fruits, vegetables, whole grains, lean proteins, and low-fat dairy while limiting sodium, saturated fat, and added sugars.

## Key Principles
The DASH diet recommends: fruits (4-5 servings/day), vegetables (4-5 servings/day), whole grains (6-8 servings/day), lean meats, poultry, and fish (6 or fewer servings/day), nuts, seeds, and legumes (4-5 servings/week), low-fat dairy (2-3 servings/day), and fats and oils (2-3 servings/day). Sodium is limited to 2,300 mg or 1,500 mg per day.

## Health Benefits
Research shows the DASH diet can lower blood pressure within two weeks, reduce LDL cholesterol, lower the risk of heart disease and stroke, support healthy weight management, and may reduce the risk of type 2 diabetes, certain cancers, and kidney stones.

## Getting Started
Gradually increase fruits and vegetables, switch to whole grains, choose lean proteins, use herbs and spices instead of salt, read food labels for sodium content, cook at home more often, and keep a food diary.

## Considerations
The DASH diet is generally safe for most adults. Those with kidney disease should consult their doctor about potassium and phosphorus intake. The diet may cost more due to emphasis on fresh foods.

## Evidence Base
The DASH diet is supported by multiple large-scale clinical trials and is recommended by the American Heart Association, the American College of Cardiology, and the National Institutes of Health.`,
    confidenceLabel: "HIGH",
    trustScore: 91,
    evidenceScore: 93,
    freshnessScore: 87,
    consensusScore: 90,
    tags: ["nutrition", "cardiovascular", "blood pressure", "prevention", "lifestyle"],
    entities: ["DASH diet", "sodium restriction", "hypertension management", "NHLBI"],
    keyFacts: [
      "The DASH diet can lower blood pressure by up to 11 mmHg.",
      "It has been consistently ranked as one of the best overall diets by health experts.",
      "DASH is recommended by the American Heart Association for heart health.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "NIH - DASH Eating Plan", url: "https://www.nhlbi.nih.gov/education/dash-eating-plan", sourceType: "government" },
      { title: "MedlinePlus - DASH Diet", url: "https://medlineplus.gov/dashdiet.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "hypertension", title: "Hypertension", score: 0.88, reason: "DASH was specifically designed to lower blood pressure." },
      { slug: "mediterranean-diet", title: "Mediterranean Diet", score: 0.75, reason: "Both diets share emphasis on whole foods and cardiovascular benefits." },
      { slug: "metabolic-syndrome", title: "Metabolic Syndrome", score: 0.65, reason: "DASH diet addresses multiple metabolic syndrome components." },
    ],
  },
  {
    slug: "mediterranean-diet",
    title: "Mediterranean Diet",
    summary:
      "The Mediterranean diet is a heart-healthy eating approach based on the traditional cuisines of countries bordering the Mediterranean Sea, emphasizing plant foods, healthy fats, and moderate fish and poultry intake.",
    bodyMarkdown: `## Overview
The Mediterranean diet is inspired by the eating habits of people living in countries around the Mediterranean Sea. It is one of the most well-studied dietary patterns and is consistently associated with reduced risk of chronic diseases.

## Key Principles
The diet emphasizes: abundant fruits and vegetables, whole grains, legumes and nuts, olive oil as the primary fat source, moderate fish and seafood, moderate poultry, eggs, and dairy, limited red meat, and moderate red wine (optional). It limits processed foods, refined grains, and added sugars.

## Health Benefits
Extensive research supports benefits including reduced cardiovascular disease risk, lower risk of type 2 diabetes, improved cognitive function and reduced dementia risk, healthy weight management, reduced inflammation, and potential cancer risk reduction.

## Getting Started
Use olive oil for cooking, eat more fish and legumes, increase fruit and vegetable intake, choose whole grains, snack on nuts instead of processed foods, use herbs and spices for flavoring, and enjoy meals with others.

## Considerations
The Mediterranean diet is flexible and adaptable to different cultures and preferences. Portion control is still important for weight management. Moderate wine consumption is optional and not recommended for everyone.

## Evidence Base
The landmark PREDIMED trial and numerous observational studies support the Mediterranean diet's benefits. It is endorsed by the World Health Organization and major medical organizations worldwide.`,
    confidenceLabel: "HIGH",
    trustScore: 92,
    evidenceScore: 94,
    freshnessScore: 88,
    consensusScore: 91,
    tags: ["nutrition", "cardiovascular", "prevention", "lifestyle"],
    entities: ["Mediterranean diet", "olive oil", "PREDIMED trial", "anti-inflammatory"],
    keyFacts: [
      "The PREDIMED trial showed a 30% reduction in cardiovascular events.",
      "UNESCO recognized the Mediterranean diet as an Intangible Cultural Heritage.",
      "It is consistently rated the best overall diet by nutrition experts.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Healthy Diet", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet", sourceType: "public-health" },
      { title: "Mayo Clinic - Mediterranean Diet", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/mediterranean-diet/art-20047801", sourceType: "medical-reference" },
    ],
    relatedSlugs: [
      { slug: "dash-diet", title: "DASH Diet", score: 0.75, reason: "Both diets share emphasis on whole foods and cardiovascular benefits." },
      { slug: "coronary-artery-disease", title: "Coronary Artery Disease", score: 0.70, reason: "Strong evidence for Mediterranean diet in CAD prevention." },
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.68, reason: "Mediterranean diet reduces risk of developing type 2 diabetes." },
      { slug: "alzheimers-disease", title: "Alzheimer's Disease", score: 0.58, reason: "Growing evidence links Mediterranean diet to reduced dementia risk." },
    ],
  },
  {
    slug: "exercise-and-health",
    title: "Exercise and Health",
    summary:
      "Regular physical activity is one of the most important things you can do for your health, reducing the risk of chronic diseases, improving mental health, and increasing longevity.",
    bodyMarkdown: `## Overview
Physical activity is essential for maintaining overall health and well-being. The evidence linking regular exercise to disease prevention and health promotion is overwhelming and well-established.

## Recommended Activity Levels
Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity activity per week, plus muscle-strengthening activities at least 2 days per week. Some physical activity is better than none.

## Health Benefits
Regular exercise reduces the risk of cardiovascular disease, type 2 diabetes, certain cancers, obesity, osteoporosis, depression, anxiety, and cognitive decline. It improves sleep quality, bone health, functional ability, and overall quality of life.

## Types of Exercise
Aerobic exercise (walking, running, cycling, swimming), strength training (weights, resistance bands, bodyweight exercises), flexibility exercises (stretching, yoga), and balance exercises (tai chi, single-leg stands) each provide unique benefits.

## Getting Started
Start slowly and gradually increase intensity, choose activities you enjoy, set realistic goals, build activity into daily routines, use the buddy system for motivation, and consult a healthcare provider if you have chronic conditions.

## Safety Considerations
Warm up before and cool down after exercise, stay hydrated, use proper form and equipment, listen to your body, and avoid exercising in extreme heat or cold. People with chronic conditions should consult their doctor about appropriate activities.`,
    confidenceLabel: "HIGH",
    trustScore: 94,
    evidenceScore: 95,
    freshnessScore: 91,
    consensusScore: 93,
    tags: ["lifestyle", "prevention", "cardiovascular", "mental health"],
    entities: ["physical activity", "aerobic exercise", "strength training", "WHO guidelines"],
    keyFacts: [
      "Physical inactivity is the fourth leading risk factor for global mortality.",
      "Regular exercise can reduce the risk of premature death by up to 30%.",
      "Even small amounts of physical activity provide health benefits.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Physical Activity", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity", sourceType: "public-health" },
      { title: "CDC - Physical Activity", url: "https://www.cdc.gov/physical-activity-basics/about/index.html", sourceType: "government" },
      { title: "NIH - Exercise and Physical Fitness", url: "https://medlineplus.gov/exerciseandphysicalfitness.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "obesity", title: "Obesity", score: 0.80, reason: "Physical activity is fundamental to weight management." },
      { slug: "type-2-diabetes", title: "Type 2 Diabetes", score: 0.75, reason: "Exercise is a cornerstone of diabetes prevention and management." },
      { slug: "major-depressive-disorder", title: "Major Depressive Disorder", score: 0.68, reason: "Exercise has well-documented antidepressant effects." },
      { slug: "osteoporosis", title: "Osteoporosis", score: 0.65, reason: "Weight-bearing exercise is essential for bone health." },
    ],
  },
  {
    slug: "smoking-cessation",
    title: "Smoking Cessation",
    summary:
      "Smoking cessation is the process of quitting tobacco smoking. It is the single most important step smokers can take to improve their health and longevity.",
    bodyMarkdown: `## Overview
Smoking is the leading cause of preventable death worldwide. Quitting smoking at any age provides significant health benefits and reduces the risk of smoking-related diseases. The benefits begin within minutes of stopping and continue to increase over time.

## Health Benefits of Quitting
Within 20 minutes, heart rate drops. Within 12 hours, carbon monoxide levels normalize. Within 2-12 weeks, circulation improves. Within 1-9 months, coughing decreases. Within 1 year, heart disease risk is halved. Within 5-15 years, stroke risk equals that of a non-smoker. Within 10 years, lung cancer risk is halved.

## Methods for Quitting
Evidence-based approaches include nicotine replacement therapy (patches, gum, lozenges, inhaler, nasal spray), prescription medications (varenicline, bupropion), behavioral counseling, quitlines, mobile apps, support groups, and combination approaches (medication plus counseling).

## Dealing with Withdrawal
Common withdrawal symptoms include irritability, anxiety, difficulty concentrating, increased appetite, cravings, restlessness, and depressed mood. Most symptoms peak within the first week and improve over 2-4 weeks.

## Relapse Prevention
Identify triggers, develop coping strategies, seek social support, avoid situations that prompt smoking, manage stress through exercise and relaxation, and remember that relapse is common and doesn't mean failure.

## Support Resources
Free help is available through national quitlines, healthcare providers, online programs, mobile apps, and community support groups. Most insurance plans cover cessation treatments.`,
    confidenceLabel: "HIGH",
    trustScore: 93,
    evidenceScore: 95,
    freshnessScore: 89,
    consensusScore: 92,
    tags: ["lifestyle", "prevention", "respiratory", "cardiovascular"],
    entities: ["smoking cessation", "nicotine replacement therapy", "varenicline", "bupropion"],
    keyFacts: [
      "Smoking causes more than 480,000 deaths per year in the US.",
      "Quitting before age 40 reduces the risk of dying from smoking-related disease by about 90%.",
      "Combination therapy (medication plus counseling) is the most effective approach.",
    ],
    readingLevel: "beginner",
    citations: [
      { title: "WHO - Tobacco", url: "https://www.who.int/news-room/fact-sheets/detail/tobacco", sourceType: "public-health" },
      { title: "CDC - Smoking Cessation", url: "https://www.cdc.gov/tobacco/quit-smoking/index.html", sourceType: "government" },
      { title: "MedlinePlus - Quitting Smoking", url: "https://medlineplus.gov/quittingsmoking.html", sourceType: "government" },
    ],
    relatedSlugs: [
      { slug: "copd", title: "COPD", score: 0.90, reason: "Smoking is the leading cause of COPD; cessation is the most important intervention." },
      { slug: "coronary-artery-disease", title: "Coronary Artery Disease", score: 0.78, reason: "Smoking significantly increases cardiovascular disease risk." },
      { slug: "exercise-and-health", title: "Exercise and Health", score: 0.60, reason: "Exercise supports smoking cessation and mitigates weight gain." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Main seed function                                                  */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(`Seeding ${articles.length} articles…`);

  // Find the reviewer user (created by seed.ts)
  const reviewer = await prisma.user.findUnique({
    where: { email: "reviewer@medipedia.local" },
  });
  if (!reviewer) {
    throw new Error(
      "Reviewer user not found. Run `prisma db seed` first to create base users."
    );
  }

  const now = new Date();

  // Pass 1: upsert every article
  for (const a of articles) {
    console.log(`  → ${a.slug}`);
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        bodyMarkdown: a.bodyMarkdown,
        status: ArticleStatus.PUBLISHED,
        confidenceLabel: a.confidenceLabel,
        trustScore: a.trustScore,
        evidenceScore: a.evidenceScore,
        freshnessScore: a.freshnessScore,
        consensusScore: a.consensusScore,
        scoreVersion: 1,
        createdBy: "reviewer@medipedia.local",
        createdById: reviewer.id,
        publishedAt: now,
        lastReviewedAt: now,
        nextReviewAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          create: {
            seoTitle: `${a.title}: Symptoms, Causes, Treatment | Medipedia`,
            seoDescription: a.summary,
            keyFacts: a.keyFacts,
            tags: a.tags,
            entities: a.entities,
            readingLevel: a.readingLevel,
            safetyFlags: ["human-reviewed"],
            generatedByModel: "editorial",
          },
        },
        citations: {
          create: a.citations,
        },
        revisions: {
          create: {
            version: 1,
            contentMarkdown: `Published baseline revision for ${a.title.toLowerCase()}.`,
            status: ArticleStatus.PUBLISHED,
            createdBy: "reviewer@medipedia.local",
            notes: "Seed article",
          },
        },
        outgoingRelated: {
          create: a.relatedSlugs.map((r) => ({
            targetSlug: r.slug,
            targetTitle: r.title,
            score: r.score,
            reason: r.reason,
          })),
        },
      },
    });
  }

  // Pass 2: wire up targetArticleId on related links where both articles exist
  console.log("\nWiring up related-article IDs…");
  const allArticles = await prisma.article.findMany({
    select: { id: true, slug: true },
  });
  const slugToId = new Map(allArticles.map((a) => [a.slug, a.id]));

  const links = await prisma.articleRelatedLink.findMany({
    where: { targetArticleId: null },
  });

  let wired = 0;
  for (const link of links) {
    const targetId = slugToId.get(link.targetSlug);
    if (targetId) {
      await prisma.articleRelatedLink.update({
        where: { id: link.id },
        data: { targetArticleId: targetId },
      });
      wired++;
    }
  }

  console.log(`Wired ${wired} related links.`);
  console.log(`\nSeed-articles complete. Total published articles: ${allArticles.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
