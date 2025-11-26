/**
 * Funções de validação para formulários
 */

/**
 * Valida um CPF brasileiro usando o algoritmo oficial
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF é válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatação (pontos, hífens e espaços)
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Verifica se não é uma sequência de números iguais (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;

  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) {
    return false;
  }

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;

  if (parseInt(cleanCPF.charAt(10)) !== secondDigit) {
    return false;
  }

  return true;
}

/**
 * Formata um CPF com máscara ###.###.###-##
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Aplica a máscara gradualmente conforme o usuário digita
  if (cleanCPF.length <= 3) {
    return cleanCPF;
  } else if (cleanCPF.length <= 6) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  } else if (cleanCPF.length <= 9) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  } else {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
  }
}

/**
 * Remove formatação do CPF, mantendo apenas números
 * @param cpf - CPF formatado
 * @returns CPF apenas com números
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/[^\d]/g, '');
}

/**
 * Valida um telefone brasileiro
 * @param phone - Telefone a ser validado
 * @returns true se o telefone é válido, false caso contrário
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9 no celular)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Formata um telefone brasileiro com máscara
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado (11) 99999-9999 ou (11) 9999-9999
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, '');

  if (cleanPhone.length <= 2) {
    return cleanPhone;
  } else if (cleanPhone.length <= 6) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
  } else if (cleanPhone.length <= 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6, 10)}`;
  } else {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
  }
}
