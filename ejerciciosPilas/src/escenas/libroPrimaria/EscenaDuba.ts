/// <reference path = "EscenaConObstaculos.ts" />
/// <reference path = "../../actores/libroPrimaria/Duba.ts" />
/// <reference path = "../../actores/libroPrimaria/Churrasco.ts" />

 class EscenaDuba extends EscenaConObstaculos {
	 crearAutomata(){
		 return new Duba();
	 }
	 archivosObstaculos(){
		 return ["obstaculo.charco.png","obstaculo.cardo.png"];
	 }
	 archivoFondo(){
		 return "fondo.duba.png";
	 }
	 premioBuscado(){
		 return new Churrasco();
	 }
}
