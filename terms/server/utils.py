import re

def parens(expr):
    """
    >>> from nl.arith import parens
    >>> parens('uno')
    'uno'
    >>> parens('(uno (dos tres) cuatro)')
    ['uno', '(dos tres)', 'cuatro']
    >>> parens('(uno (dos tres) (ho ho (he (ha ha))) cuatro)')
    ['uno', '(dos tres)', '(ho ho (he (ha ha)))', 'cuatro']
    """
    if expr[0] != '(':
        return expr
    depth = 0
    term = ''
    terms = []
    for c in expr:
        if c == '(':
            if term:
                terms.append(term)
                term = ''
            depth += 1
            if depth > 1:
                term += c
        elif c == ')':
            depth -= 1
            if depth > 0:
                term += c
        else:
            term += c
    terms.append(term)
    if depth != 0:
        raise ValueError('wrong arithmetic expression')
    return terms

fact_pattern = re.compile(r'^([^\s]+)\s+([^\s]+)(,\s+(.+))?$')

def deconstruct_fact(f):
    parts = parens(f)
    nested = {}
    simple = ''
    for n, part in enumerate(parts):
        if '(' in part:
            k = 'c%d' % n
            nested[k] = part
            simple += k
        else:
            simple += part
    m = fact_pattern.match(simple)
    fact = {'verb': m.group(1)}
    fact['mods'] = {}
    fact['mods']['subject'] = m.group(2)
    if m.group(4):
        mods = m.group(4).split(',')
        for mod in mods:
            label, value = mod.split()
            fact['mods'][label.strip()] = value.strip()
    for kf, nf in nested.items():
        for k, m in fact['mods'].items():
            if kf == m:
                fact['mods'][k] = deconstruct_fact(nf)
    return fact


def cover_term(t1, t2, prev):
    if t1.istitle():
        if t1 in prev:
            if prev[t1] != t2:
                return False
        else:
            prev[t1] = t2
    elif t1 != t2:
        return False
    return True


def cover(f1, f2, match=None):
    if match is None:
        match = {}
    if not cover_term(f1['verb'], f2['verb'], match):
        return False
    m1, m2 = f1['mods'], f2['mods']
    for k in m1:
        if k not in m2:
            return False
        elif isinstance(m1[k], dict):
            if not cover(m1[k], m2[k], match):
                return False
        elif not cover_term(m1[k], m2[k], match):
            return False
    return match


def register(sen1):
    s1 = deconstruct_fact(sen1)
    def wrapper(fun):
        def inner(kb, sen2):
            s2 = deconstruct_fact(sen2)
            vrs = cover(s1, s2)
            return fun(**vrs)
        return inner
    return wrapper
