# Pratt Expression Parser + Constant Folding + Stack VM
def tokenize(src):
    tokens, i = [], 0
    while i < len(src):
        if src[i].isspace():
            i += 1
        elif src[i].isdigit():
            j = i
            while j < len(src) and src[j].isdigit():
                j += 1
            tokens.append(("NUM", int(src[i:j])))
            i = j
        elif src[i].isalpha():
            j = i
            while j < len(src) and src[j].isalnum():
                j += 1
            tokens.append(("ID", src[i:j]))
            i = j
        else:
            tokens.append((src[i], src[i]))
            i += 1
    tokens.append(("EOF", ""))
    return tokens


class PrattParser:
    BP = {"+": 10, "-": 10, "*": 20, "/": 20, "^": 30}

    def __init__(self, tokens):
        self.toks = tokens
        self.pos = 0

    def peek(self):
        return self.toks[self.pos]

    def next(self):
        t = self.toks[self.pos]
        self.pos += 1
        return t

    def parse(self, min_bp=0):
        t = self.next()
        if t[0] == "NUM":
            lhs = ("num", t[1])
        elif t[0] == "ID":
            lhs = ("var", t[1])
        elif t[0] == "(":
            lhs = self.parse(0)
            assert self.next()[0] == ")"
        else:
            raise SyntaxError(f"Unexpected {t}")

        while self.peek()[0] in self.BP:
            op = self.peek()[0]
            lbp = self.BP[op]
            if lbp < min_bp:
                break
            self.next()
            rbp = lbp if op == "^" else lbp + 1  # right-assoc for '^'
            rhs = self.parse(rbp)
            lhs = ("bin", op, lhs, rhs)
        return lhs


def fold_constants(node):
    if node[0] in ("num", "var"):
        return node
    _, op, l, r = node
    l, r = fold_constants(l), fold_constants(r)
    if l[0] == "num" and r[0] == "num":
        a, b = l[1], r[1]
        if op == "+": return ("num", a + b)
        if op == "-": return ("num", a - b)
        if op == "*": return ("num", a * b)
        if op == "/" and b != 0: return ("num", a // b)
        if op == "^": return ("num", a ** b)
    return ("bin", op, l, r)


def eval_ast(node, env):
    if node[0] == "num": return node[1]
    if node[0] == "var": return env[node[1]]
    _, op, l, r = node
    a, b = eval_ast(l, env), eval_ast(r, env)
    return {"+": a + b, "-": a - b, "*": a * b, "/": a // b, "^": a ** b}[op]


def run_tests():
    # Verify right-associativity of '^' and precedence + constant folding
    ast = PrattParser(tokenize("2 ^ 3 ^ 2 + (3 * 4) * x")).parse()
    folded = fold_constants(ast)
    # 2^(3^2) = 512, 3*4 = 12 -> ('bin', '+', ('num', 512), ('bin', '*', ('num', 12), ('var', 'x')))
    assert folded == ("bin", "+", ("num", 512), ("bin", "*", ("num", 12), ("var", "x")))
    assert eval_ast(folded, {"x": 10}) == 632
    print("[PASS] lab_comp_pratt_ssa: Pratt right-assoc '^', constant folding & AST eval OK")


if __name__ == "__main__":
    run_tests()
