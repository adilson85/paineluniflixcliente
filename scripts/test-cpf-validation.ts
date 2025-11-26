/**
 * Script de teste para validação de CPF
 * Execute com: npm run test:cpf-validation
 */

import { validateCPF, formatCPF, cleanCPF } from '../src/lib/validators';

console.log('=== TESTE DE VALIDAÇÃO DE CPF ===\n');

// Casos de teste
const testCases = [
  // CPFs válidos
  { cpf: '123.456.789-09', expected: true, description: 'CPF válido formatado' },
  { cpf: '12345678909', expected: true, description: 'CPF válido sem formatação' },
  { cpf: '111.444.777-35', expected: true, description: 'CPF válido comum' },

  // CPFs inválidos
  { cpf: '111.111.111-11', expected: false, description: 'CPF inválido (sequência de números iguais)' },
  { cpf: '123.456.789-00', expected: false, description: 'CPF inválido (dígito verificador errado)' },
  { cpf: '000.000.000-00', expected: false, description: 'CPF inválido (todos zeros)' },
  { cpf: '12345678', expected: false, description: 'CPF inválido (menos de 11 dígitos)' },
  { cpf: '123456789012', expected: false, description: 'CPF inválido (mais de 11 dígitos)' },
  { cpf: '', expected: false, description: 'CPF vazio' },
];

console.log('1. TESTE DE VALIDAÇÃO:\n');
let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  const result = validateCPF(test.cpf);
  const status = result === test.expected ? '✅ PASSOU' : '❌ FALHOU';

  if (result === test.expected) {
    passedTests++;
  } else {
    failedTests++;
  }

  console.log(`${index + 1}. ${test.description}`);
  console.log(`   CPF: "${test.cpf}"`);
  console.log(`   Esperado: ${test.expected}, Resultado: ${result}`);
  console.log(`   ${status}\n`);
});

console.log(`\nRESUMO: ${passedTests} testes passaram, ${failedTests} falharam\n`);

// Teste de formatação
console.log('2. TESTE DE FORMATAÇÃO:\n');

const formatTests = [
  { input: '12345678909', expected: '123.456.789-09' },
  { input: '123', expected: '123' },
  { input: '123456', expected: '123.456' },
  { input: '123456789', expected: '123.456.789' },
  { input: '12345678909', expected: '123.456.789-09' },
];

formatTests.forEach((test, index) => {
  const result = formatCPF(test.input);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${index + 1}. Input: "${test.input}" → Output: "${result}" (esperado: "${test.expected}") ${status}`);
});

// Teste de limpeza
console.log('\n3. TESTE DE LIMPEZA:\n');

const cleanTests = [
  { input: '123.456.789-09', expected: '12345678909' },
  { input: '111.111.111-11', expected: '11111111111' },
  { input: '123abc456def', expected: '123456' },
];

cleanTests.forEach((test, index) => {
  const result = cleanCPF(test.input);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${index + 1}. Input: "${test.input}" → Output: "${result}" (esperado: "${test.expected}") ${status}`);
});

console.log('\n=== FIM DOS TESTES ===');

// Se todos os testes passaram, exit com código 0, senão exit com código 1
process.exit(failedTests > 0 ? 1 : 0);
