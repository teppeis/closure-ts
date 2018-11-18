// from https://github.com/Constellation/estraverse
/*
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const VisitorKeys = {
  NullableLiteral: ['expression'],
  AllLiteral: [],
  NullLiteral: [],
  UndefinedLiteral: [],
  VoidLiteral: [],
  UnionType: ['elements'],
  ArrayType: ['elements'],
  RecordType: ['fields'],
  FieldType: ['value'],
  FunctionType: ['params', 'result'],
  ParameterType: ['expression'],
  RestType: ['expression'],
  NonNullableType: ['expression'],
  OptionalType: ['expression'],
  NullableType: ['expression'],
  NameExpression: [],
  TypeApplication: ['expression', 'applications'],
};

export const VisitorOption = {
  Break: 1,
  Skip: 2,
};

export function traverse(top, visitor) {
  let node, ret, current, current2, candidates, candidate;
  const marker = {};
  const worklist = [top];
  const leavelist = [null];

  while (worklist.length) {
    node = worklist.pop();

    if (node === marker) {
      node = leavelist.pop();
      if (visitor.leave) {
        ret = visitor.leave(node, leavelist[leavelist.length - 1]);
      } else {
        ret = undefined;
      }
      if (ret === VisitorOption.Break) {
        return;
      }
    } else if (node) {
      if (visitor.enter) {
        ret = visitor.enter(node, leavelist[leavelist.length - 1]);
      } else {
        ret = undefined;
      }

      if (ret === VisitorOption.Break) {
        return;
      }

      worklist.push(marker);
      leavelist.push(node);

      if (ret !== VisitorOption.Skip) {
        candidates = VisitorKeys[node.type];
        current = candidates.length;
        while ((current -= 1) >= 0) {
          const candidateKey = candidates[current];
          candidate = node[candidateKey];
          if (candidate) {
            if (Array.isArray(candidate)) {
              current2 = candidate.length;
              while ((current2 -= 1) >= 0) {
                if (candidate[current2]) {
                  const candidate2 = candidate[current2];
                  worklist.push(candidate2);
                }
              }
            } else {
              worklist.push(candidate);
            }
          }
        }
      }
    }
  }
}
