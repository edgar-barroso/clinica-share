/**
 * Hierarquia de erros de domínio. `AuthError` é a base; cada subclasse vira
 * um HTTP status mapeado em `handle-error.ts`.
 *
 * Apesar do nome `AuthError`, a classe cobre todos os erros tratáveis
 * (auth, RBAC, conflito, validação, regra de negócio). Mantida com este nome
 * por compatibilidade — pode ser renomeada em uma fase futura sem alterar
 * status mapping (a estrutura é por subclasse).
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmailJaCadastrado extends AuthError {
  constructor() {
    super("E-mail já cadastrado");
  }
}

export class CredenciaisInvalidas extends AuthError {
  constructor() {
    super("E-mail ou senha inválidos");
  }
}

export class TokenInvalido extends AuthError {
  constructor() {
    super("Token inválido");
  }
}

export class TokenExpirado extends AuthError {
  constructor() {
    super("Token expirado");
  }
}

export class ProvedorGoogleInvalido extends AuthError {
  constructor() {
    super("Token Google inválido");
  }
}

export class NaoAutenticado extends AuthError {
  constructor() {
    super("Não autenticado");
  }
}

export class NaoAutorizado extends AuthError {
  constructor(message = "Acesso negado para este perfil") {
    super(message);
  }
}

export class NaoEncontrado extends AuthError {
  constructor(recurso = "Recurso") {
    super(`${recurso} não encontrado`);
  }
}

export class ConflitoRecurso extends AuthError {
  constructor(message = "Conflito com recurso existente") {
    super(message);
  }
}

export class RegraNegocio extends AuthError {
  constructor(message: string) {
    super(message);
  }
}
