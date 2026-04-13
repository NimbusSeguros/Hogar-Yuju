import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env depending on your path relative config
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
