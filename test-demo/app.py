"""
Simple Streamlit Demo - Image Classifier (No Model Required)
This demo shows a simple image upload with basic color analysis.
"""

import streamlit as st
import numpy as np
from PIL import Image

# Page config
st.set_page_config(
    page_title="Simple Image Analyzer",
    page_icon="🖼️",
    layout="centered"
)

# Title and description
st.title("🖼️ Simple Image Analyzer")
st.markdown("""
This is a simple demo that analyzes uploaded images.
It doesn't require any pre-trained model files - perfect for testing!
""")

# Sidebar
st.sidebar.header("Options")
show_histogram = st.sidebar.checkbox("Show Color Histogram", value=True)
show_stats = st.sidebar.checkbox("Show Image Statistics", value=True)

# File uploader
uploaded_file = st.file_uploader(
    "Upload an image", 
    type=['png', 'jpg', 'jpeg', 'gif', 'bmp']
)

if uploaded_file is not None:
    # Load image
    image = Image.open(uploaded_file)
    img_array = np.array(image)
    
    # Display original image
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Original Image")
        st.image(image, use_container_width=True)
    
    with col2:
        st.subheader("Image Info")
        st.write(f"**Filename:** {uploaded_file.name}")
        st.write(f"**Size:** {image.size[0]} x {image.size[1]} pixels")
        st.write(f"**Mode:** {image.mode}")
        st.write(f"**Format:** {image.format or 'Unknown'}")
    
    # Color analysis
    if len(img_array.shape) == 3:
        if show_stats:
            st.subheader("📊 Color Statistics")
            
            # Calculate mean colors
            if img_array.shape[2] >= 3:
                mean_r = np.mean(img_array[:, :, 0])
                mean_g = np.mean(img_array[:, :, 1])
                mean_b = np.mean(img_array[:, :, 2])
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Red Channel", f"{mean_r:.1f}")
                col2.metric("Green Channel", f"{mean_g:.1f}")
                col3.metric("Blue Channel", f"{mean_b:.1f}")
                
                # Dominant color guess
                colors = {'Red': mean_r, 'Green': mean_g, 'Blue': mean_b}
                dominant = max(colors, key=lambda x: colors[x])
                st.info(f"🎨 Dominant color channel: **{dominant}**")
        
        if show_histogram:
            st.subheader("📈 Color Histogram")
            import matplotlib.pyplot as plt
            
            fig, ax = plt.subplots(figsize=(10, 4))
            
            color_names = ['red', 'green', 'blue']
            for i, color in enumerate(color_names):
                if i < img_array.shape[2]:
                    ax.hist(img_array[:, :, i].flatten(), bins=50, 
                           alpha=0.5, color=color, label=color.capitalize())
            
            ax.set_xlabel('Pixel Value')
            ax.set_ylabel('Frequency')
            ax.legend()
            ax.set_title('RGB Color Distribution')
            
            st.pyplot(fig)
    else:
        st.write("This is a grayscale image")
        if show_stats:
            mean_val = np.mean(img_array)
            st.metric("Mean Brightness", f"{mean_val:.1f}")
    
    # Simple "classification" based on average brightness
    st.subheader("🔍 Simple Analysis")
    avg_brightness = np.mean(img_array)
    
    if avg_brightness < 85:
        label = "Dark Image 🌙"
        description = "This image has low overall brightness."
    elif avg_brightness < 170:
        label = "Normal Image ☀️"
        description = "This image has balanced brightness."
    else:
        label = "Bright Image ⭐"
        description = "This image has high overall brightness."
    
    st.success(f"**Classification:** {label}")
    st.write(description)
    st.progress(int(avg_brightness / 255 * 100))
    st.caption(f"Average brightness: {avg_brightness:.1f} / 255")

else:
    st.info("👆 Please upload an image to analyze it!")
    
    # Show sample usage
    st.markdown("---")
    st.markdown("### How to use:")
    st.markdown("""
    1. Click the **Browse files** button above
    2. Select an image file (PNG, JPG, JPEG, GIF, or BMP)
    3. View the analysis results!
    """)

# Footer
st.markdown("---")
st.caption("Demo created for AI Model Bazaar - Testing Purpose")
