import path from 'path';
import fs from 'fs';

const deleteImage = (filePath) => {
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error(`Failed to delete image: ${err.message}`);
        } else {
            console.log(`Image deleted successfully: ${fullPath}`);
        }
    });
};

export default deleteImage;