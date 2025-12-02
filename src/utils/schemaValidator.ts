import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

const ajv = new Ajv();

export interface ValidationResult {
    isValid: boolean;
    errors?: any[];
}

export const validateSchema = (schemaPath: string, data: any): ValidationResult => {
    try {
        const absolutePath = path.resolve(schemaPath);
        if (!fs.existsSync(absolutePath)) {
            Logger.error(`Schema file not found at: ${absolutePath}`);
            return { isValid: false, errors: [`Schema file not found: ${absolutePath}`] };
        }

        const schemaContent = fs.readFileSync(absolutePath, 'utf-8');
        const schema = JSON.parse(schemaContent);

        const validate = ajv.compile(schema);
        const valid = validate(data);

        if (!valid) {
            Logger.error('Schema validation failed', validate.errors);
            return { isValid: false, errors: validate.errors || [] };
        }

        Logger.info('Schema validation passed');
        return { isValid: true };
    } catch (error) {
        Logger.error('Error during schema validation', error);
        return { isValid: false, errors: [error] };
    }
};
