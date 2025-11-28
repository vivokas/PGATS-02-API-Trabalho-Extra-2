import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 3,
  duration: "10s",

  thresholds: {
    http_req_duration: ["p(90)<=50", "p(95)<=600"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Gerando usuários de forma randômica

  const remetente = `remetente_${__VU}_${Date.now()}_${Math.floor(
    Math.random() * 9999
  )}`;
  const destinatario = `destinatario_${Math.floor(Math.random() * 99999)}`;

  function criarUsuario(nome) {
    return http.post(
      "http://localhost:3001/users/register",
      JSON.stringify({
        username: nome,
        password: "123456",
        favorecidos: [],
      }),

      { headers: { "Content-Type": "application/json" } }
    );
  }

  const regRem = criarUsuario(remetente);
  const regDest = criarUsuario(destinatario);

  check(regRem, { "remetente criado status 201": (r) => r.status === 201 });
  check(regDest, { "destinatário criado status 201": (r) => r.status === 201 });

  sleep(0.3);

  ///Realizar login
  const loginUsuario = http.post(
    "http://localhost:3001/users/login",
    JSON.stringify({
      username: remetente,
      password: "123456",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const token = loginUsuario.json("token");

  //Transferencia usuarios
  const transferUsuario = http.post(
    "http://localhost:3001/transfers",
    JSON.stringify({
      from: remetente,
      to: destinatario,
      value: 50,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  check(transferUsuario, {
    "transferência realizada status 201": (r) => r.status === 201,
  });

  sleep(1);
}
