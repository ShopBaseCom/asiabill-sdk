interface Gateway {
    authorize(Credential)
}

interface Credential {

}

class AsiaBillCredential implements Credential {

}

class Asiabill implements Gateway {
    authorize(AsiaBillCredential) {
    }

}