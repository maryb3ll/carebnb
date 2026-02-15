Model overview:
Problem statement: For a healthcare provider to patient platform, a company wants to make it so that patients can upload an audio file describing their symptoms/how they are feeling. An AI Agent model system should then take the information from that audio file and create a summary for the healthcare provider on the other end in an ordered format (information like meds, dose, allergies, condition) and does retrieval generation in order to give the doctors a better idea of the patients conditions and what occupation this might fall under.
General model purpose: The model should work in four components. Component 1: Transcribing audio to text. Component 2: Key word extraction. Component 3: AI Agent for RAG based on that key word extraction. Component 4: AI Agent to do summary based on the articles given and the described patient condition. Prepares an ordered format of the information in a pdf. In general the input should be an audio file and the output should be a pdf that gives a summary of the patient's condition, the specialities that might relate to their condition, devices needed to test, etc. The model should be for direct use after it is done, aka. The model should be saved in such a way that it can be used to take in an audio file and output an api after being called on after training/finetuning. 
End Goal: Give an audio file to the model (any audio file). Output a pdf in the discussed summary format.
Model workflow.
Component 1: Audio to Text
Input: audio file. Output: json file to the folder data/components/component1 and in the naming convention [testing iteration]_[component number]_output.[file type]
Take in an audio file 
Use Open AI whisper API: gpt-4o-mini-transcribe to get the json file transcript 
Component 2: Key Word Extraction
Input: json file from component 1. Output: json of the relevant keywords and short description of the transcription to the folder data/components/component2 and in the naming convention [testing iteration]_[component number]_output.[file type]
Fine Tune Chat 4o mini (if there is already a fine tuned model id then it shouldn’t run fine tuning again and should just use the model id that already exists)
Dataset to train on (Already downloaded in this project): https://www.kaggle.com/datasets/tboyle10/medicaltranscriptions/data
For fine tuning: model should take the column of the sample medical transcriptions as the system role (the stimulus) and the assistant role (output) should be the relevant keywords and short description of the transcription columns
Convert the data into the necessary json file output to fine tune train chat gpt 4 o mini on 
The fine tuned model should output the json of the relevant keywords and short description of the transcription to the output folder as described
The fine tuned model’s model id should be saved to src/models/config.py that can be used later. 
Component 3: AI Agent RAG
Input: json of the relevant keywords and short description of transcription from Component 2. Output: Gets together relevant sources that relate to the descriptions and provides a summary of all the information together. The information should be on professions in healthcare that relate to the keywords, what devices are needed to evaluate symptoms if at all, conditions that the home needs. To the folder data/components/component3 and in the naming convention [testing iteration]_[component number]_output.[file type] for a summary of the rag results. The 3 sources found should be saved as individual PDFs with the naming convention [testing iteration]_[component number]_[source number].pdf (e.g., 1_3_1.pdf, 1_3_2.pdf, 1_3_3.pdf). These individual source PDFs are required for Component 4 to process.
Use the Claude SDK Agent to search for more articles depending on what information it has the most on (refer to the final output for the sections/information it should be looking for), think through patient safety, and reflect on what is involved in the patient care
Format the input to Claude SDK (use claude-opus-4-6) as such: 
Settings: Adaptive thinking, Effort medium
Prompt: Perform a medical RAG for this patient in the categories of related healthcare fields, devices needed for diagnosis and treatment of symptoms, and urgency level of the patients based on the following keywords/summary description of patient condition [dump json file referenced in component 2]. Search PubMed Central (PMC) and read abstracts from 5-10 results. Select the 3 most relevant sources and download their full PDFs. PMC contains only open-access articles with full-text PDFs available
System prompt: You are an experienced doctor and research agent. Use PubMed Central (PMC) to analyze the given data to gather relevant sources and information from the prompt.
Allowed_tools should be PMCSearch and Writing to a pdf. Use metapub library to search PubMed Central (PMC) and download the full PDFs for the sources. PMC contains only open-access articles with full-text PDFs guaranteed to be available. Save 3 of the sources found as individual PDF files 
Max turns should be 4
The model shouldn’t take too long as this needs to be demo’d this so don’t have the model search for too many articles. Limit it to official sources/papers like PubMed
Component 4: AI Agent Summarizer
Input: json of keywords and short description from Component 2 and the relevant sources/summary from Component 3 (pdf format). Output: A formatted pdf that lists the keywords and short description at the top as well as an informed summary based on the sources. to the folder data/components/component4 and in the naming convention [testing iteration]_[component number]_output.[file type]. Additionally, read the 3 source PDFs from Component 3, identify and highlight the most important/relevant sections in each PDF, and save these highlighted versions as [testing iteration]_4_source_[source number].pdf (e.g., 1_4_source_1.pdf, 1_4_source_2.pdf, 1_4_source_3.pdf). Zip the final summary PDF together with the highlighted source PDFs into the folder output with the naming convention [testing iteration]_final.zip
Use o1-mini model
It should follow: input -> thoughts -> init action -> reflection -> final action format
Chain of thought model based on this architecture (https://github.com/itsuncheng/werewolf-template/blob/main/src/werewolf_agents/SuperWolf/agent/cot_agent.py) in terms of the model taking in an input, having a prompt of what it should do (that should be adjustable), reflecting on its response in different sections, before outputting 
For the role prompt: "You are a doctor who is evaluating a patient based on key words and a summary of their symptoms. You also have additional information on sources related to their condition, symptoms, treatments, and urgency level. Your goal is to bring together all this information into a pdf that evaluates keywords, summary of transcript, a patient-friendly summary that can be quoted back to patients, related healthcare fields, devices needed, and urgency level of the patient. "
For the specific prompt during reflection: “Review the patient keywords and summary and review what your output text looks like so far. Check for the relevancy of the content to the keywords. Check for source consistency and that your information matches the given sources. Check that the information fits into the categories described in your role prompt.”
Sections that should be filled out for the final output:
Keywords:
Summary of Transcript:
Patient Summary (simplified, patient-friendly language that doctors can quote back to patients):
Related healthcare fields:
Devices needed:
Urgency level of patient: 

Implementation notes:
Anything packages that need to be installed should be noted in the requirements.txt
The components should be implemented in the /src folder with each component being implemented in its respective src\models\component_[component number] folder 
There is a src/models/config.py file and this should contain the model_id of the fine tuned model for the keyword_extractor
When passing information from one component to another the way to check for file consistency between them is to check it is reading the right testing iteration number. For iteration 4 component 2 should be taking from the 4_1_output.[file type]
Testing for the model:
Each output of the data should be in its respective folder of data/components/component[component number]
Any errors and fixes that need to be made should be recorded in the ClaudeInfo/errors_fixes.MD file where the errors should be listed by component
Everytime a component is read there should be a naming system for the outputs. The files should keep track of what iteration it is at where it should be [testing iteration number]_[component number]_output.[file type] in their respective output folders. The testing iterations refer to how many times that component has been run. If we’ve run it 1 time then it should be 1. This should be checked in data/components/iteration_tracker.txt which is intialized to be “iteration=0”  and should already exist. The iteration number what comes after iteration= [iteration number].




