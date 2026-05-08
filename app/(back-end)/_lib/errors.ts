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
