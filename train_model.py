import os
import glob
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

# Configuration Constants
IMG_SIZE = 128
NUM_CLEANLINESS_CLASSES = 3  # 0: Clean, 1: Slightly Dirty, 2: Very Dirty
NUM_TRASH_CLASSES = 6        # 0: Dry, 1: Wet, 2: Plastic, 3: Mixed, 4: Trees, 5: Branches
TRASH_CLASS_NAMES = ["Dry", "Wet", "Plastic", "Mixed", "Trees", "Branches"]

DATASET_DIR = r"C:\Users\Kokila\OneDrive\Desktop\TakeMyTrash\RoadDataset"

class HybridRoadDataset(Dataset):
    def __init__(self, image_paths, labels, multiply_factor=10, transform=None):
        """
        image_paths: list of paths to the real road images
        labels: list of cleanliness labels matching the image_paths (0, 1, 2)
        multiply_factor: how many times to repeat the dataset to allow different trash overlay permutations
        """
        self.image_paths = image_paths
        self.labels = labels
        self.multiply_factor = multiply_factor
        self.transform = transform
        self.total_size = len(image_paths) * multiply_factor

    def __len__(self):
        return self.total_size

    def __getitem__(self, idx):
        # Map back to original index
        orig_idx = idx % len(self.image_paths)
        img_path = self.image_paths[orig_idx]
        cleanliness = self.labels[orig_idx]

        # Load real background image and convert to RGB
        try:
            bg_img = Image.open(img_path).convert("RGB")
        except Exception as e:
            # Fallback if image fails to load
            bg_img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), (80, 80, 80))
            
        bg_img = bg_img.resize((IMG_SIZE, IMG_SIZE))
        
        # Trash labels: Dry, Wet, Plastic, Mixed, Trees, Branches
        trash_labels = np.zeros(NUM_TRASH_CLASSES, dtype=np.float32)
        
        if cleanliness == 0:
            # Clean road has no trash overlay
            pass
        elif cleanliness == 1:
            # Slightly dirty has 1 or 2 trash labels active
            active_trash_idx = random.sample(range(NUM_TRASH_CLASSES), random.randint(1, 2))
            for t_idx in active_trash_idx:
                trash_labels[t_idx] = 1.0
        else:
            # Very dirty has 2 to 4 trash labels active, mixed is highly likely
            num_active = random.randint(2, 4)
            active_trash_idx = random.sample(range(NUM_TRASH_CLASSES), num_active)
            for t_idx in active_trash_idx:
                trash_labels[t_idx] = 1.0
            # mixed waste is highly likely
            trash_labels[3] = 1.0  # Mixed is true

        # Overlay synthetic trash items on the real road background
        img = self._overlay_synthetic_trash(bg_img, cleanliness, trash_labels)
        
        if self.transform:
            img = self.transform(img)
            
        return img, cleanliness, torch.tensor(trash_labels, dtype=torch.float32)

    def _overlay_synthetic_trash(self, img, cleanliness, trash_labels):
        # Create a draw context
        draw = ImageDraw.Draw(img)
        
        # Helper to get random coordinate on the road (concentrated on bottom half for realistic perspective)
        def get_road_coords():
            rx = random.randint(15, IMG_SIZE - 15)
            ry = random.randint(40, IMG_SIZE - 15)
            return rx, ry

        # Add plastic bottles/bags
        if trash_labels[2] == 1.0: # Plastic
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                cx, cy = get_road_coords()
                size = random.randint(4, 9)
                bottle_color = (random.randint(100, 150), random.randint(180, 230), random.randint(220, 255))
                draw.ellipse([cx - size, cy - size//2, cx + size, cy + size//2], fill=bottle_color)
                # Add cap
                draw.rectangle([cx + size, cy - 2, cx + size + 2, cy + 2], fill=(255, 255, 255))

        # Add dry trash (cardboard, paper wrappers)
        if trash_labels[0] == 1.0: # Dry
            num_items = random.randint(1, 2)
            for _ in range(num_items):
                cx, cy = get_road_coords()
                w = random.randint(8, 15)
                h = random.randint(6, 11)
                cardboard_color = (random.randint(200, 220), random.randint(170, 190), random.randint(120, 140))
                draw.rectangle([cx - w//2, cy - h//2, cx + w//2, cy + h//2], fill=cardboard_color, outline=(150, 110, 80))

        # Add wet trash (food spills, organic sludge)
        if trash_labels[1] == 1.0: # Wet
            num_items = random.randint(1, 2)
            for _ in range(num_items):
                cx, cy = get_road_coords()
                r_size = random.randint(5, 10)
                sludge_color = (random.randint(60, 90), random.randint(50, 75), random.randint(30, 45))
                draw.ellipse([cx - r_size, cy - r_size, cx + r_size, cy + r_size], fill=sludge_color)
                # Add splatters
                for _ in range(3):
                    sx = cx + random.randint(-6, 6)
                    sy = cy + random.randint(-6, 6)
                    draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=sludge_color)

        # Add trees (leaves)
        if trash_labels[4] == 1.0: # Trees
            num_items = random.randint(2, 5)
            for _ in range(num_items):
                cx, cy = get_road_coords()
                leaf_size = random.randint(3, 7)
                leaf_color = (random.randint(30, 70), random.randint(100, 150), random.randint(30, 60))
                draw.polygon([(cx, cy - leaf_size), (cx + leaf_size, cy), (cx, cy + leaf_size), (cx - leaf_size, cy)], fill=leaf_color)

        # Add branches
        if trash_labels[5] == 1.0: # Branches
            num_items = random.randint(1, 2)
            for _ in range(num_items):
                cx, cy = get_road_coords()
                length = random.randint(15, 28)
                angle_offset = random.randint(-15, 15)
                branch_color = (100, 60, 30)
                draw.line([(cx, cy), (cx + length, cy + angle_offset)], fill=branch_color, width=3)
                draw.line([(cx + length//2, cy + angle_offset//2), (cx + length//2 + 5, cy + angle_offset//2 - 5)], fill=branch_color, width=2)

        # Add Mixed trash elements if labelled
        if trash_labels[3] == 1.0: # Mixed
            cx, cy = get_road_coords()
            draw.rectangle([cx - 4, cy - 4, cx + 4, cy + 4], fill=(220, 50, 50), outline=(255, 255, 255))
            cx2, cy2 = get_road_coords()
            draw.ellipse([cx2 - 4, cy2 - 4, cx2 + 4, cy2 + 4], fill=(70, 60, 50))

        # Apply blur filter slightly to blend vectors into background pixels
        img = img.filter(ImageFilter.GaussianBlur(0.2))

        # Add light augmentations
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(random.uniform(0.8, 1.2))

        return img

# Define the Multi-Task Convolutional Neural Network
class MultiTaskStreetCNN(nn.Module):
    def __init__(self):
        super(MultiTaskStreetCNN, self).__init__()
        
        # Shared Feature Extractor
        self.feature_extractor = nn.Sequential(
            # Block 1: 128x128 -> 64x64
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            # Block 2: 64x64 -> 32x32
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            # Block 3: 32x32 -> 16x16
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            # Block 4: 16x16 -> 8x8
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Shared Fully Connected Block
        self.fc_shared = nn.Sequential(
            nn.Linear(128 * 8 * 8, 256),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        
        # Head 1: Cleanliness Grade (Clean, Slightly Dirty, Very Dirty)
        self.cleanliness_head = nn.Sequential(
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, NUM_CLEANLINESS_CLASSES)
        )
        
        # Head 2: Trash Type Classifier (Dry, Wet, Plastic, Mixed, Trees, Branches)
        self.trash_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, NUM_TRASH_CLASSES)
        )

    def forward(self, x):
        features = self.feature_extractor(x)
        features = features.view(features.size(0), -1) # Flatten
        shared_fc = self.fc_shared(features)
        
        clean_logits = self.cleanliness_head(shared_fc)
        trash_logits = self.trash_head(shared_fc)
        
        return clean_logits, trash_logits

def load_dataset_paths():
    """
    Scans the local directory and builds image paths and labels lists.
    """
    clean_paths = glob.glob(os.path.join(DATASET_DIR, "CleanRoad", "*.png"))
    clean_paths.extend(glob.glob(os.path.join(DATASET_DIR, "CleanRoad", "*.jpg")))
    clean_paths.extend(glob.glob(os.path.join(DATASET_DIR, "CleanRoad", "*.jpeg")))
    
    slight_paths = glob.glob(os.path.join(DATASET_DIR, "SligthlyDirty", "*.png"))
    slight_paths.extend(glob.glob(os.path.join(DATASET_DIR, "SligthlyDirty", "*.jpg")))
    slight_paths.extend(glob.glob(os.path.join(DATASET_DIR, "SligthlyDirty", "*.jpeg")))
    
    dirty_paths = glob.glob(os.path.join(DATASET_DIR, "VeryDirty", "*.png"))
    dirty_paths.extend(glob.glob(os.path.join(DATASET_DIR, "VeryDirty", "*.jpg")))
    dirty_paths.extend(glob.glob(os.path.join(DATASET_DIR, "VeryDirty", "*.jpeg")))
    
    # 0 = Clean, 1 = Slightly Dirty, 2 = Very Dirty
    all_paths = clean_paths + slight_paths + dirty_paths
    all_labels = [0]*len(clean_paths) + [1]*len(slight_paths) + [2]*len(dirty_paths)
    
    # Combine and shuffle
    combined = list(zip(all_paths, all_labels))
    random.shuffle(combined)
    
    paths, labels = zip(*combined)
    return list(paths), list(labels)

def train_model():
    print("--------------------------------------------------")
    print("Preparing Street AIQ Model Training Pipeline...")
    print(f"Loading real road images from: {DATASET_DIR}")
    
    # Check directory
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Directory '{DATASET_DIR}' not found. Please make sure it is correct.")
        return
        
    image_paths, labels = load_dataset_paths()
    print(f"Found {len(image_paths)} total source images in dataset:")
    print(f"  - CleanRoad: {labels.count(0)} images")
    print(f"  - SligthlyDirty: {labels.count(1)} images")
    print(f"  - VeryDirty: {labels.count(2)} images")
    print("--------------------------------------------------")
    
    # Split into train and validation (85% train, 15% val)
    split_idx = int(len(image_paths) * 0.85)
    train_paths, train_labels = image_paths[:split_idx], labels[:split_idx]
    val_paths, val_labels = image_paths[split_idx:], labels[split_idx:]
    
    # Image Transforms (Normalize & convert to tensor)
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Multiply dataset size by factor of 10 to augment positions and overlays
    train_dataset = HybridRoadDataset(train_paths, train_labels, multiply_factor=12, transform=transform)
    val_dataset = HybridRoadDataset(val_paths, val_labels, multiply_factor=5, transform=transform)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    print(f"Dataset Size Expansion for Training:")
    print(f"  - Augmented Training Samples: {len(train_dataset)}")
    print(f"  - Augmented Validation Samples: {len(val_dataset)}")
    print("--------------------------------------------------")
    
    # Initialize Model, Loss Functions and Optimizer
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Executing training on computing device: {device}")
    
    model = MultiTaskStreetCNN().to(device)
    
    criterion_clean = nn.CrossEntropyLoss()
    criterion_trash = nn.BCEWithLogitsLoss()
    
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    
    epochs = 10
    print(f"Starting model training for {epochs} epochs...")
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        correct_clean_train = 0
        total_train = 0
        
        for images, cleanliness, trash_labels in train_loader:
            images = images.to(device)
            cleanliness = cleanliness.to(device)
            trash_labels = trash_labels.to(device)
            
            optimizer.zero_grad()
            
            # Forward pass
            clean_logits, trash_logits = model(images)
            
            # Loss calculations
            loss_clean = criterion_clean(clean_logits, cleanliness)
            loss_trash = criterion_trash(trash_logits, trash_labels)
            
            # Joint multi-task loss weighting
            loss = loss_clean + 2.0 * loss_trash
            
            # Backward pass & optimize
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * images.size(0)
            
            # Train accuracy stats for cleanliness
            _, predicted_clean = torch.max(clean_logits, 1)
            correct_clean_train += (predicted_clean == cleanliness).sum().item()
            total_train += cleanliness.size(0)
            
        epoch_train_loss = train_loss / total_train
        train_clean_acc = (correct_clean_train / total_train) * 100
        
        # Validation Loop
        model.eval()
        val_loss = 0.0
        correct_clean_val = 0
        total_val = 0
        
        correct_trash_val = 0
        total_trash_elements = 0
        
        with torch.no_grad():
            for images, cleanliness, trash_labels in val_loader:
                images = images.to(device)
                cleanliness = cleanliness.to(device)
                trash_labels = trash_labels.to(device)
                
                clean_logits, trash_logits = model(images)
                
                loss_clean = criterion_clean(clean_logits, cleanliness)
                loss_trash = criterion_trash(trash_logits, trash_labels)
                loss = loss_clean + 2.0 * loss_trash
                
                val_loss += loss.item() * images.size(0)
                
                # Cleanliness stats
                _, predicted_clean = torch.max(clean_logits, 1)
                correct_clean_val += (predicted_clean == cleanliness).sum().item()
                total_val += cleanliness.size(0)
                
                # Trash multi-label accuracy stats (threshold at 0.5 probability)
                trash_probs = torch.sigmoid(trash_logits)
                predicted_trash = (trash_probs > 0.5).float()
                correct_trash_val += (predicted_trash == trash_labels).sum().item()
                total_trash_elements += trash_labels.numel()
                
        epoch_val_loss = val_loss / total_val
        val_clean_acc = (correct_clean_val / total_val) * 100
        val_trash_acc = (correct_trash_val / total_trash_elements) * 100
        
        print(f"Epoch {epoch+1}/{epochs} | "
              f"Train Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | "
              f"Val Cleanliness Acc: {val_clean_acc:.2f}% | Val Trash Acc: {val_trash_acc:.2f}%")
        
    # Save the trained model weights
    save_path = "street_cleanliness_model.pth"
    torch.save(model.state_dict(), save_path)
    print("--------------------------------------------------")
    print(f"Training completed! Model weights saved successfully to: {os.path.abspath(save_path)}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    train_model()
