;***************************************************************************
;*                              mowayWorld                                 *
;***************************************************************************
;*Description:                                                             *
;*Automatically generated code                                             *
;***************************************************************************
;***************************************************************************
	list p=18F86j50
   ;*	Include mOways microcontroller
   #include "inc\P18F86j50.INC"

;*	Reset Vector
  org		0x1000
  goto	INIT
;*	Program memory	*
  org		0x102A
;************************
;***************************[MOWAY LIBRARIES]*********************************************
  #include "inc\lib_sen_moway_GUI.inc"
  #include "inc\lib_rf2gh4_GUI.inc"
  #include "inc\lib_mot_moway_GUI.inc"
  #include "inc\lib_cam_moway_GUI.inc"
;*************************************

INIT:

;#####################################
  ;*************************[MOWAY CONFIGURATION]***********************
  ;Sensor configuration
  call    SEN_CONFIG
  ;Motor configuration
  call    MOT_CONFIG

;************Module Move*************************************************

;***********************************************************************

  movlw   .50
  movwf   MOT_VEL
  bcf     MOT_CON,COMTYPE
  movlw   .40
  movwf   MOT_T_DIST_ANG
  bcf     MOT_CON,FWDBACK
  call    MOT_STR
  call    MOT_CHECK_END

;***********************************************************************

loopEnd:
  goto    loopEnd

END
