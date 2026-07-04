import os
import sys
import random
import numpy as np
import torch
from torchvision import transforms
from PIL import Image
# Import model and constants from train_model.py
from train_model import MultiTaskStreetCNN, HybridRoadDataset, load_dataset_paths, TRASH_CLASS_NAMES

def main():
    import time
    random.seed(time.time())
    np.random.seed(int(time.time() * 1000) % 2**32)
    torch.manual_seed(int(time.time() * 1000) % 2**32)
    
    print("--------------------------------------------------")
    print("Street AIQ - Inference Verification System")
    print("--------------------------------------------------")
    
    # Check if weights exist
    weights_path = "street_cleanliness_model.pth"
    if not os.path.exists(weights_path):
        print(f"Error: Trained model weights not found at '{weights_path}'. Please run 'train_model.py' first.")
        sys.exit(1)
        
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Initialize and load model
    model = MultiTaskStreetCNN()
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()
    
    # Preprocessing transforms (Must match training normalization)
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load an image or generate a random mock image
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    if image_path:
        if not os.path.exists(image_path):
            print(f"Error: Input image path '{image_path}' does not exist.")
            sys.exit(1)
        print(f"Loading user input image: {image_path}")
        original_img = Image.open(image_path).convert("RGB").resize((128, 128))
        true_clean = "Unknown (Real Image)"
        true_trash = "Unknown (Real Image)"
    else:
        print("No input image path provided. Picking a random real road image and overlaying trash...")
        try:
            paths, labels = load_dataset_paths()
            rand_idx = random.randint(0, len(paths) - 1)
            eval_dataset = HybridRoadDataset([paths[rand_idx]], [labels[rand_idx]], multiply_factor=1, transform=None)
            original_img, true_clean_idx, true_trash_vec = eval_dataset[0]
            
            clean_grades = ["Clean", "Slightly Dirty", "Very Dirty"]
            true_clean = clean_grades[true_clean_idx]
            
            active_trash = [TRASH_CLASS_NAMES[i] for i, val in enumerate(true_trash_vec) if val == 1.0]
            true_trash = ", ".join(active_trash) if active_trash else "None"
            
            # Save this image to disk so the user can inspect it
            test_img_path = "test_inference_input.png"
            original_img.save(test_img_path)
            print(f"Saved generated test image (real photo base) to: {os.path.abspath(test_img_path)}")
        except Exception as e:
            print(f"Error loading dataset sample: {e}")
            sys.exit(1)

    # Preprocess image
    tensor_img = transform(original_img).unsqueeze(0).to(device) # Add batch dimension
    
    # Run model prediction
    with torch.no_grad():
        clean_logits, trash_logits = model(tensor_img)
        
        # Softmax for Cleanliness Grade
        clean_probs = torch.softmax(clean_logits, dim=1)[0]
        pred_clean_idx = torch.argmax(clean_probs).item()
        
        # Sigmoid for Multi-label Trash types
        trash_probs = torch.sigmoid(trash_logits)[0]
        
    cleanliness_labels = ["Clean Road", "Slightly Dirty Road", "Very Dirty Road"]
    predicted_cleanliness = cleanliness_labels[pred_clean_idx]
    clean_confidence = clean_probs[pred_clean_idx].item() * 100
    
    print("\n--------------------------------------------------")
    print("VERIFICATION RESULTS")
    print("--------------------------------------------------")
    print(f"True Cleanliness Grade: {true_clean}")
    print(f"True Trash Categories:  {true_trash}")
    print("--------------------------------------------------")
    print(f"Predicted Cleanliness: {predicted_cleanliness} ({clean_confidence:.2f}% confidence)")
    print("Detected Trash Types (Probability > 50%):")
    
    found_any = False
    for i, prob in enumerate(trash_probs):
        p_val = prob.item()
        is_detected = p_val > 0.5
        status_tag = "[DETECTED]" if is_detected else "[ABSENT]"
        
        # Format printing
        indicator = "*" if is_detected else " "
        print(f" {indicator} {TRASH_CLASS_NAMES[i]:10s} : {p_val*100:6.2f}% {status_tag}")
        if is_detected:
            found_any = True
            
    if not found_any:
        print("  No trash detected on road surface.")
    print("--------------------------------------------------")

if __name__ == "__main__":
    main()
