// The function a paper diagram plots (Arena 10-25), e.g. "2^x",
// "log_2(x)", "x^3-3x+1", "abs(x-1)", "sin(x)". A tiny parser that only
// knows numbers, x, pi, + - * / ^, parentheses and a short list of
// functions; anything else is rejected. Never eval.
// The same file lives in twinkle-api (helpers/arena/diagramExpr.ts), which
// validates diagrams on import; keep the two in step.

export type DiagramExpr =
  | { op: 'num'; value: number }
  | { op: 'x' }
  | { op: 'neg'; arg: DiagramExpr }
  | { op: '+' | '-' | '*' | '/' | '^'; left: DiagramExpr; right: DiagramExpr }
  | { op: 'call'; fn: DiagramFn; arg: DiagramExpr };

export type DiagramFn = 'sin' | 'cos' | 'abs' | 'log2' | 'sqrt';

const FUNCTIONS: Record<string, DiagramFn> = {
  sin: 'sin',
  cos: 'cos',
  abs: 'abs',
  sqrt: 'sqrt',
  log2: 'log2',
  log_2: 'log2'
};

export const DIAGRAM_EXPR_MAX_LENGTH = 120;
const MAX_DEPTH = 24;

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'name'; value: string }
  | { kind: 'sym'; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    const num = /^(\d+(\.\d+)?|\.\d+)/.exec(source.slice(i));
    if (num) {
      tokens.push({ kind: 'num', value: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    const name = /^(log_2|log2|[a-z]+)/.exec(source.slice(i));
    if (name) {
      tokens.push({ kind: 'name', value: name[0] });
      i += name[0].length;
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ kind: 'sym', value: ch });
      i++;
      continue;
    }
    throw new Error(`"${ch}" is not allowed`);
  }
  return tokens;
}

// expr := term (('+'|'-') term)*
// term := unary (('*'|'/') unary | implicit factor)*
// unary := '-' unary | power
// power := atom ('^' unary)?        (right-associative, -x^2 = -(x^2))
// atom := number | x | pi | fn '(' expr ')' | '(' expr ')'
export function parseDiagramExpr(source: string): DiagramExpr {
  const text = String(source ?? '');
  if (!text.trim()) throw new Error('empty expression');
  if (text.length > DIAGRAM_EXPR_MAX_LENGTH)
    throw new Error('expression too long');
  const tokens = tokenize(text);
  let at = 0;
  let depth = 0;
  const peek = () => tokens[at];
  const isSym = (value: string) =>
    peek()?.kind === 'sym' && peek()!.value === value;
  const expect = (value: string) => {
    if (!isSym(value)) throw new Error(`expected "${value}"`);
    at++;
  };
  const enter = () => {
    if (++depth > MAX_DEPTH) throw new Error('expression nested too deeply');
  };
  const startsAtom = () => {
    const t = peek();
    return (
      !!t &&
      (t.kind === 'num' ||
        t.kind === 'name' ||
        (t.kind === 'sym' && t.value === '('))
    );
  };

  function expr(): DiagramExpr {
    enter();
    let left = term();
    while (isSym('+') || isSym('-')) {
      const op = (tokens[at++] as any).value as '+' | '-';
      left = { op, left, right: term() };
    }
    depth--;
    return left;
  }
  function term(): DiagramExpr {
    let left = unary();
    for (;;) {
      if (isSym('*') || isSym('/')) {
        const op = (tokens[at++] as any).value as '*' | '/';
        left = { op, left, right: unary() };
      } else if (startsAtom()) {
        // 3x, 2sin(x), (x-1)(x+2)
        left = { op: '*', left, right: power() };
      } else {
        return left;
      }
    }
  }
  function unary(): DiagramExpr {
    if (isSym('-')) {
      at++;
      enter();
      const arg = unary();
      depth--;
      return { op: 'neg', arg };
    }
    if (isSym('+')) {
      at++;
      return unary();
    }
    return power();
  }
  function power(): DiagramExpr {
    const base = atom();
    if (isSym('^')) {
      at++;
      enter();
      const exponent = unary();
      depth--;
      return { op: '^', left: base, right: exponent };
    }
    return base;
  }
  function atom(): DiagramExpr {
    const t = peek();
    if (!t) throw new Error('unexpected end');
    if (t.kind === 'num') {
      at++;
      return { op: 'num', value: t.value };
    }
    if (t.kind === 'name') {
      at++;
      if (t.value === 'x') return { op: 'x' };
      if (t.value === 'pi') return { op: 'num', value: Math.PI };
      const fn = FUNCTIONS[t.value];
      if (!fn) throw new Error(`"${t.value}" is not allowed`);
      expect('(');
      const arg = expr();
      expect(')');
      return { op: 'call', fn, arg };
    }
    if (t.value === '(') {
      at++;
      const inner = expr();
      expect(')');
      return inner;
    }
    throw new Error(`unexpected "${t.value}"`);
  }

  const tree = expr();
  if (at < tokens.length)
    throw new Error(`unexpected "${(tokens[at] as any).value}"`);
  return tree;
}

export function evalDiagramExpr(tree: DiagramExpr, x: number): number {
  switch (tree.op) {
    case 'num':
      return tree.value;
    case 'x':
      return x;
    case 'neg':
      return -evalDiagramExpr(tree.arg, x);
    case '+':
      return evalDiagramExpr(tree.left, x) + evalDiagramExpr(tree.right, x);
    case '-':
      return evalDiagramExpr(tree.left, x) - evalDiagramExpr(tree.right, x);
    case '*':
      return evalDiagramExpr(tree.left, x) * evalDiagramExpr(tree.right, x);
    case '/':
      return evalDiagramExpr(tree.left, x) / evalDiagramExpr(tree.right, x);
    case '^':
      return Math.pow(
        evalDiagramExpr(tree.left, x),
        evalDiagramExpr(tree.right, x)
      );
    case 'call': {
      const v = evalDiagramExpr(tree.arg, x);
      if (tree.fn === 'sin') return Math.sin(v);
      if (tree.fn === 'cos') return Math.cos(v);
      if (tree.fn === 'abs') return Math.abs(v);
      if (tree.fn === 'sqrt') return v < 0 ? NaN : Math.sqrt(v);
      return v <= 0 ? NaN : Math.log2(v);
    }
  }
}

// null when the expression is not allowed
export function compileDiagramExpr(
  source: string
): ((x: number) => number) | null {
  try {
    const tree = parseDiagramExpr(source);
    return (x: number) => evalDiagramExpr(tree, x);
  } catch {
    return null;
  }
}
