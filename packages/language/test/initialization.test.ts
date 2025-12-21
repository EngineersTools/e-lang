import { describe, test, expect } from 'vitest';
import { createELangServices } from '../src/e-lang-module.js';
import { EmptyFileSystem } from 'langium';

describe('ELang Service Initialization', () => {
    test('Should create services without crashing', () => {
        try {
            const services = createELangServices(EmptyFileSystem);
            expect(services.ELang).toBeDefined();
            console.log('Services initialized successfully');
        } catch (error) {
            console.error('Service initialization failed:', error);
            throw error;
        }
    });
});
