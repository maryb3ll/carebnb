from openai import OpenAI
from .config_handler import model_exists, save_model_id, get_model_id
from .prepare_dataset import prepare_dataset
from . import config
from .utils import log_error
import time

def fine_tune_model():
    """Fine-tune GPT-4o-mini for keyword extraction."""

    # Check if model already exists
    if model_exists():
        existing_id = get_model_id()
        print(f"✓ Model already exists: {existing_id}")
        print("✓ Skipping fine-tuning")
        return existing_id

    try:
        # Prepare dataset
        print("Preparing dataset...")
        train_count, val_count = prepare_dataset()

        # Initialize OpenAI client
        client = OpenAI(api_key=config.OPENAI_API_KEY)

        # Upload training file
        print("Uploading training data...")
        with open(config.TRAINING_JSONL, 'rb') as f:
            training_file = client.files.create(file=f, purpose='fine-tune')

        # Upload validation file
        print("Uploading validation data...")
        with open(config.VALIDATION_JSONL, 'rb') as f:
            validation_file = client.files.create(file=f, purpose='fine-tune')

        # Create fine-tuning job
        print("Creating fine-tuning job...")
        job = client.fine_tuning.jobs.create(
            training_file=training_file.id,
            validation_file=validation_file.id,
            model=config.BASE_MODEL
        )

        print(f"✓ Fine-tuning job created: {job.id}")
        print("⏳ Waiting for fine-tuning to complete...")

        # Monitor progress
        while True:
            job_status = client.fine_tuning.jobs.retrieve(job.id)
            status = job_status.status

            if status == 'succeeded':
                model_id = job_status.fine_tuned_model
                print(f"✓ Fine-tuning complete!")
                print(f"✓ Model ID: {model_id}")

                # Save model ID
                save_model_id(model_id)
                return model_id

            elif status in ['failed', 'cancelled']:
                error_msg = f"Fine-tuning {status}"
                log_error(2, error_msg)
                raise Exception(error_msg)

            print(f"  Status: {status}...")
            time.sleep(60)  # Check every minute

    except Exception as e:
        error_msg = f"Fine-tuning failed: {str(e)}"
        log_error(2, error_msg)
        raise
