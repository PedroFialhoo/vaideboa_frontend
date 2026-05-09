import { View, Text, TouchableOpacity, Switch, TextInput, ScrollView } from "react-native";
import { User, Bell, ShieldCheck, LogOut, ChevronRight, Save, Lock, Smartphone, Contact, Calendar, EyeOff, Eye } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import "@/global.css"
import { router } from "expo-router";
import { getToken, resetToken } from "@/src/services/storage";
import { api } from "@/src/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaskedTextInput } from "react-native-mask-text";
import { useFocusEffect } from "@react-navigation/native";
import { Input, InputField } from "@/components/ui/input";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showSecurityForm, setShowSecurityForm] = useState(false);
  const [gender, setGender] = useState("NAO_INFORMADO");
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("") 
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("") 
  const [cpf, setCpf] = useState("")
  const [dateBirth, setDateBirth] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false); 
  const [cpfNull, setCpfNull] = useState(false) 
  const [dateBirthNull, setDateBirthNull] = useState(false) 
  const [message, setMessage] = useState("")
  const [goodMessage, setGoodMessage] = useState(true)
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  

  const logout = async () => {
    await resetToken();
    router.replace("/");
  };

  function getUser(){
    getToken().then(token => {
      api.get("/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        setName(response.data.nome)
        setPhone(response.data.telefone)
        setGender(response.data.genero)
        setCpf(response.data.cpf)
        setDateBirth(response.data.dataNascimento)
        if(response.data.dataNascimento === "NAO_INFORMADO" || response.data.dataNascimento === null){
          setDateBirthNull(true)
          setDateBirth("")
        } 
        if(response.data.cpf === "NAO_INFORMADO" || response.data.cpf === null){ 
          setCpfNull(true)
          setCpf("")
        }
        console.log("Dados do usuário:", response.data);
        console.log(dateBirthNull, cpfNull);
      })
      .catch(error => {
        console.error("Erro ao obter dados do usuário:", error);
      })
    })
  }

  useEffect(() => {
      getUser()
    }, [])
  
  useFocusEffect(
    useCallback(() => {
      getUser()
    }, [])
  );

  const updateUserPassword = () => {
    setMessage("")
    console.log(oldPassword, newPassword, newPasswordConfirm)
    if (!oldPassword.trim()) {
      setMessage("Confirma pra gente sua senha atual!");
      setGoodMessage(false);
      return;
    }

    if (!newPassword.trim()) {
      setMessage("Ué, cadê a nova senha?");
      setGoodMessage(false);
      return;
    }

    if (!newPasswordConfirm.trim()) {
      setMessage("Confirma a nova senha, só pra ter certeza!");
      setGoodMessage(false);
      return;
    }

    if(newPassword !== newPasswordConfirm) {
      setMessage("Ops, as novas senhas são diferentes. Dá uma olhadinha aí!");
      setGoodMessage(false);
      return;
    }

    getToken().then(token => {
      api.put(
        "/user/alterarSenha",
        {
          senhaAtual: oldPassword,
          novaSenha: newPassword,
          confirmarSenha: newPasswordConfirm
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      .then(response => {
        console.log(response.data)
        setMessage(response.data)
        setGoodMessage(true)
      })
      .catch(err => {
        console.log("Erro: ", err.response?.data)
        setMessage(err.response?.data)
        setGoodMessage(false)
      })
    })
  }

  const updateUser = () => {
    setMessage("")
    console.log(name, phone, dateBirth, gender, cpf)
    if (name === null || !name.trim()) {
      setMessage("Fala pra gente seu nome. Assim sabemos como te chamar!");
      setGoodMessage(false);
      return;
    }

    if (phone === null || !phone.trim()) {
      setMessage("Coloca seu telefone. Vai que a gente precisa falar com você!");
      setGoodMessage(false);
      return;
    }

    if (cpf === null || !cpf.trim()) {
      setMessage("Precisamos do seu CPF. É importante para manter tudo certinho!");
      setGoodMessage(false);
      return;
    }

    if (dateBirth === null || !dateBirth.trim()) {
      setMessage("Conta pra gente sua data de nascimento. Prometemos lembrar do seu aniversário!");
      setGoodMessage(false);
      return;
    }

    getToken().then(token => {
      api.put(
        "/user/editar",
        {
          nome: name,
          telefone: phone,
          dataNascimento: dateBirth,
          genero: gender,
          cpf: cpf
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      .then(response => {
        console.log(response.data)
        setMessage(response.data)
        setGoodMessage(true)
      })
      .catch(err => {
        console.log("Erro: ", err.response?.data)
        setMessage(err.response?.data)
        setGoodMessage(false)
      })
    })
  }

  return (
    <View className="flex-1 bg-vintage-grape-200">
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <Text className="text-velvet-orchid-900 font-black text-lg mb-4">Configurações da Conta</Text>
          
          {/* SEÇÃO: DADOS PESSOAIS */}
          <View className="border-b border-platinum">
            <TouchableOpacity 
              onPress={() => {
                setShowPersonalForm(!showPersonalForm);
                setShowSecurityForm(false);
                setMessage("")
              }}
              className="flex-row items-center py-4"
            >
              <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
                <User size={22} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-velvet-orchid-900">Dados Pessoais</Text>
                <Text className="text-gray-500 text-xs">Nome, telefone e gênero</Text>
              </View>
              <View style={{ transform: [{ rotate: showPersonalForm ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="#391f47" opacity={0.3} />
              </View>
            </TouchableOpacity>

            {showPersonalForm && (
              <View className="pb-6 px-2 animate-in fade-in duration-300">
                <View className="space-y-4">
                  <View>
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">NOME</Text>
                    <TextInput placeholder="Seu nome" className="bg-platinum/30 rounded-xl p-3 text-velvet-orchid-900 border" 
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">TELEFONE</Text>
                    <MaskedTextInput
                      mask="(99) 99999-9999"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={(text, rawText) => {
                        setPhone(rawText);
                      }}
                      placeholder="(00) 00000-0000"
                      style={{
                        borderRadius: 12,
                        padding: 12,
                        color: "#4B2E5E",
                        borderWidth: 1,
                        borderColor: "#271831"
                      }}
                    />
                  </View>
                  {cpfNull && (
                    <View className="mt-3">
                      <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">CPF</Text>
                      <MaskedTextInput
                        mask="999.999.999-99"
                        keyboardType="phone-pad"
                        value={cpf}
                        onChangeText={(text, rawText) => {
                          setCpf(rawText);
                        }}
                        placeholder="000.000.000-00"
                        style={{
                          borderRadius: 12,
                          padding: 12,
                          color: "#4B2E5E", // velvet-orchid-900
                          borderWidth: 1,
                          borderColor: "#271831"
                        }}
                      />
                    </View>
                  )}
                  {dateBirthNull && (                  
                    <View className="mt-3">
                      <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">
                        DATA DE NASCIMENTO
                      </Text>

                      <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="flex-1 flex-row items-center bg-platinum/50 rounded-2xl px-4 h-14 border border-purple-900"
                      >
                        <Calendar size={20} color="#7b4d91" />
                        <Text className="ml-3 font-semibold">
                          {dateBirth
                            ? new Date(dateBirth).toLocaleDateString("pt-BR")
                            : "Selecionar data"}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          value={dateBirth ? new Date(dateBirth) : new Date()}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                              setDateBirth(selectedDate.toISOString());
                            }
                          }}
                        />
                      )}
                    </View>  
                  )} 
                                  
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-2 ml-1">GÊNERO</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {["MASCULINO", "FEMININO", "OUTROS", "NAO_INFORMADO"].map((option) => {
                        const isSelected = gender === option;
                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() => setGender(option)}
                            className={`px-3 py-2 rounded-xl border ${
                              isSelected 
                                ? "bg-velvet-orchid-700 border-velvet-orchid-700" 
                                : "bg-platinum/30 border-platinum"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                isSelected ? "text-white" : "text-velvet-orchid-900"
                              }`}
                            >
                              {option.replace("_", " ")}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                  {message.length > 0 && (
                    <View className={`mt-4 p-3 rounded-2xl border ${goodMessage ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <Text className={`text-center font-bold text-xs ${goodMessage ? 'text-green-700' : 'text-red-700'}`}>
                        {message}
                      </Text>
                    </View>
                  )}
                </View>                
                  <TouchableOpacity className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mt-5"
                    onPress={updateUser}
                  >
                    <Save size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold">Salvar Alterações</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* SEÇÃO: SEGURANÇA */}
          <View className="border-b border-platinum">
            <TouchableOpacity 
              onPress={() => {
                setShowSecurityForm(!showSecurityForm);
                setShowPersonalForm(false);
                setMessage("")
              }}
              className="flex-row items-center py-4"
            >
              <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
                <ShieldCheck size={22} color="#7b4d91" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-velvet-orchid-900">Segurança</Text>
                <Text className="text-gray-500 text-xs">Alterar sua senha</Text>
              </View>
              <View style={{ transform: [{ rotate: showSecurityForm ? '90deg' : '0deg' }] }}>
                <ChevronRight size={20} color="#391f47" opacity={0.3} />
              </View>
            </TouchableOpacity>

            {showSecurityForm && (
              <View className="pb-6 px-2">
                <View className="space-y-4">
                  <View>
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">SENHA ANTIGA</Text>
                    <View className="bg-platinum/30 rounded-xl border flex-row items-center px-3">
                      <TextInput
                        placeholder="Senha super secreta"
                        secureTextEntry={!showOldPassword}
                        className="flex-1 py-3 text-velvet-orchid-900"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                      />

                      <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                        {showOldPassword ? 
                          <EyeOff size={22} color="#7b4d91" /> : 
                          <Eye size={22} color="#7b4d91" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">NOVA SENHA</Text>
                    <View className="bg-platinum/30 rounded-xl border flex-row items-center px-3">
                      <TextInput
                        placeholder="Nova senha mega secreta"
                        secureTextEntry={!showNewPassword}
                        className="flex-1 py-3 text-velvet-orchid-900"
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />

                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? 
                          <EyeOff size={22} color="#7b4d91" /> : 
                          <Eye size={22} color="#7b4d91" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="mt-3">
                    <Text className="text-velvet-orchid-700 font-bold text-xs mb-1 ml-1">CONFIRMAR NOVA SENHA</Text>
                    <View className="bg-platinum/30 rounded-xl border flex-row items-center px-3">
                      <TextInput
                        placeholder="Repete a nova senha hiper secreta"
                        secureTextEntry={!showNewPasswordConfirm}
                        className="flex-1 py-3 text-velvet-orchid-900"
                        value={newPasswordConfirm}
                        onChangeText={setNewPasswordConfirm}
                      />

                      <TouchableOpacity onPress={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}>
                        {showNewPasswordConfirm ? 
                          <EyeOff size={22} color="#7b4d91" /> : 
                          <Eye size={22} color="#7b4d91" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                  {message.length > 0 && (
                    <View className={`mt-4 p-3 rounded-2xl border ${goodMessage ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <Text className={`text-center font-bold text-xs ${goodMessage ? 'text-green-700' : 'text-red-700'}`}>
                        {message}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    className="bg-velvet-orchid-700 rounded-xl p-3 flex-row items-center justify-center mt-3"
                    onPress={updateUserPassword}
                  >
                    <Lock size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold">Atualizar Senha</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* NOTIFICAÇÕES */}
          <View className="flex-row items-center py-4">
            <View className="bg-purple-x11-100 p-2 rounded-xl mr-4">
              <Bell size={22} color="#7b4d91" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-velvet-orchid-900">Notificações</Text>
              <Text className="text-gray-500 text-xs">Alertas de carona e mensagens</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: "#D1D5DB", true: "#7b4d91" }}
              thumbColor="white"
            />
          </View>
        </View>

        <TouchableOpacity 
          className="bg-white rounded-3xl p-6 shadow-sm flex-row items-center justify-center active:bg-red-50 mb-10"
          onPress={logout}  
        >
          <LogOut size={22} color="#EF4444" className="mr-2" />
          <Text className="text-red-500 font-black text-lg">Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}