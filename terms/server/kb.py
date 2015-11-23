from multiprocessing.connection import Client


def ask_kb(config, q):
    '''
    ask kb synchronously
    '''
    conn = Client((config('kb_host'),
                    int(config('kb_port'))))
    conn.send_bytes(q)
    conn.send_bytes('FINISH-TERMS')
    recv, resp = '', ''
    while recv != 'END':
        resp = recv
        recv = conn.recv_bytes()
    conn.close()
    return resp
