import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

import { Colors, Spacing } from "@/constants/theme";
import { PressableScale } from "@/components/PressableScale";

const LAST_UPDATED = "[DATE_DE_MAJ]";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <PressableScale
          onPress={() => router.back()}
          style={styles.iconButton}
          scaleTo={0.92}
        >
          <ArrowLeft size={20} color={Colors.encre} strokeWidth={2} />
        </PressableScale>
        <Text style={styles.topTitle}>Confidentialité</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Politique de confidentialité</Text>
          <Text style={styles.metaLine}>Dernière mise à jour : {LAST_UPDATED}</Text>
        </View>

        <Section title="1. Introduction">
          <P>
            La présente politique décrit comment l&apos;application{" "}
            <B>RecetteBox</B> collecte, utilise et protège les données à
            caractère personnel de ses utilisateurs, conformément au
            Règlement (UE) 2016/679 (« <B>RGPD</B> ») et à la loi
            Informatique et Libertés du 6 janvier 1978 modifiée.
          </P>
          <P>
            En utilisant l&apos;Application, vous reconnaissez avoir pris
            connaissance de la présente politique.
          </P>
        </Section>

        <Section title="2. Responsable du traitement">
          <P>
            Le responsable du traitement est{" "}
            <B>[ÉDITEUR_NOM_LEGAL]</B>, [FORME_JURIDIQUE], dont le siège
            social est situé [ADRESSE_POSTALE_COMPLÈTE], immatriculée sous
            le numéro [RCS_OU_SIRET].
          </P>
          <P>
            <B>Contact :</B> contact@polynetia.com.
          </P>
          <P>
            <B>Délégué à la protection des données (DPO) :</B>{" "}
            [NOM_DPO_OU_MENTION_PAS_DE_DPO_DÉSIGNÉ] — [EMAIL_DPO].
          </P>
        </Section>

        <Section title="3. Données collectées et finalités">
          <P>
            Nous traitons les catégories de données suivantes, uniquement
            pour les finalités précisées ci-dessous :
          </P>

          <Text style={styles.h3}>Données de compte</Text>
          <Bullet>
            <B>Adresse email</B> et <B>prénom</B> — pour créer et identifier
            votre compte, pour vous envoyer les communications de service
            (confirmation, réinitialisation de mot de passe).
          </Bullet>

          <Text style={styles.h3}>Préférences d&apos;onboarding</Text>
          <Bullet>
            Taille du foyer, niveau de cuisine, temps disponible,
            restrictions alimentaires, frictions déclarées — pour
            personnaliser les portions par défaut et les filtres de
            l&apos;Application.
          </Bullet>

          <Text style={styles.h3}>Données d&apos;import</Text>
          <Bullet>
            URL des publications partagées (Instagram, TikTok), métadonnées
            publiques associées (auteur de la publication, durée de la
            vidéo), recettes extraites par l&apos;IA — pour fournir le
            service principal de l&apos;Application.
          </Bullet>

          <Text style={styles.h3}>Données techniques</Text>
          <Bullet>
            Jetons de notification push (Apple, Google), journaux serveur
            techniques (adresse IP, type d&apos;appareil, horodatage,
            erreurs) — pour acheminer les notifications, assurer la
            sécurité et diagnostiquer les incidents.
          </Bullet>

          <Text style={styles.h3}>Données d&apos;abonnement</Text>
          <Bullet>
            Identifiant de transaction et statut d&apos;abonnement transmis
            par l&apos;App Store, Google Play et RevenueCat — pour gérer
            l&apos;accès aux fonctionnalités payantes.
          </Bullet>

          <P>
            <B>Aucun outil de mesure d&apos;audience ni traceur publicitaire
            n&apos;est intégré dans la version actuelle de
            l&apos;Application.</B>
          </P>
        </Section>

        <Section title="4. Bases légales">
          <P>
            Les traitements décrits ci-dessus reposent sur les bases légales
            suivantes :
          </P>
          <Bullet>
            <B>Exécution du contrat</B> (article 6.1.b RGPD) — pour la
            création de compte, la fourniture du service d&apos;import, la
            gestion des abonnements.
          </Bullet>
          <Bullet>
            <B>Intérêt légitime</B> (article 6.1.f RGPD) — pour la sécurité
            de l&apos;Application, la lutte contre la fraude et les
            journaux techniques.
          </Bullet>
          <Bullet>
            <B>Consentement</B> (article 6.1.a RGPD) — pour l&apos;envoi de
            notifications push et, le cas échéant, pour les éventuelles
            mesures d&apos;audience qui seraient ajoutées ultérieurement.
            Vous pouvez retirer votre consentement à tout moment.
          </Bullet>
          <Bullet>
            <B>Obligation légale</B> (article 6.1.c RGPD) — pour la
            conservation des données comptables et la coopération avec les
            autorités compétentes.
          </Bullet>
        </Section>

        <Section title="5. Destinataires et sous-traitants">
          <P>
            Vos données sont accessibles uniquement aux personnes
            habilitées de l&apos;Éditeur et aux sous-traitants suivants,
            engagés par contrat conformément à l&apos;article 28 du RGPD :
          </P>
          <Bullet>
            <B>Supabase</B> (hébergement de la base de données et des
            fichiers) — région Union européenne (Francfort, Allemagne).
          </Bullet>
          <Bullet>
            <B>Railway</B> (serveur applicatif pour le traitement des
            imports).
          </Bullet>
          <Bullet>
            <B>OpenAI</B> (États-Unis) — transcription audio des vidéos
            importées (modèle Whisper).
          </Bullet>
          <Bullet>
            <B>Anthropic</B> (États-Unis) — analyse visuelle des images et
            structuration des recettes (modèle Claude).
          </Bullet>
          <Bullet>
            <B>Apple Push Notification Service</B> (Apple Inc., États-Unis)
            et <B>Firebase Cloud Messaging</B> (Google LLC, États-Unis) —
            acheminement des notifications push.
          </Bullet>
          <Bullet>
            <B>RevenueCat</B> (États-Unis) — gestion des abonnements
            in-app.
          </Bullet>
          <P>
            Aucune donnée n&apos;est vendue à des tiers à des fins
            commerciales.
          </P>
        </Section>

        <Section title="6. Transferts hors Union européenne">
          <P>
            Certains sous-traitants (OpenAI, Anthropic, Apple, Google,
            RevenueCat) sont établis aux États-Unis. Ces transferts sont
            encadrés par les <B>clauses contractuelles types</B> adoptées
            par la Commission européenne (décision 2021/914) et, le cas
            échéant, par l&apos;adhésion au <B>Data Privacy Framework</B>{" "}
            UE–États-Unis.
          </P>
          <P>
            Les données envoyées à OpenAI et Anthropic pour la transcription
            et l&apos;analyse sont traitées en mode API, sans réutilisation
            pour l&apos;entraînement de modèles, conformément aux politiques
            commerciales de ces prestataires.
          </P>
        </Section>

        <Section title="7. Durées de conservation">
          <Bullet>
            <B>Données de compte et recettes :</B> conservées tant que le
            compte est actif. En cas de suppression du compte par
            l&apos;utilisateur, les données sont effacées sous 30 jours,
            sauf obligation légale de conservation.
          </Bullet>
          <Bullet>
            <B>Journaux techniques :</B> 12 mois maximum.
          </Bullet>
          <Bullet>
            <B>Données comptables liées aux abonnements :</B> 10 ans à
            compter de la transaction, conformément aux obligations
            comptables et fiscales.
          </Bullet>
          <Bullet>
            <B>Jetons de notification push :</B> jusqu&apos;à révocation par
            le système d&apos;exploitation ou suppression du compte.
          </Bullet>
        </Section>

        <Section title="8. Sécurité">
          <P>
            L&apos;Éditeur met en œuvre des mesures techniques et
            organisationnelles destinées à protéger les données :
            chiffrement des connexions en TLS, chiffrement au repos chez
            l&apos;hébergeur, contrôle d&apos;accès par rôles et journaux
            d&apos;audit, séparation stricte entre les données de chaque
            utilisateur (Row Level Security).
          </P>
          <P>
            En cas de violation de données susceptible d&apos;engendrer un
            risque pour vos droits et libertés, vous serez informé dans les
            conditions prévues à l&apos;article 34 du RGPD.
          </P>
        </Section>

        <Section title="9. Vos droits">
          <P>
            Conformément aux articles 15 à 22 du RGPD, vous disposez des
            droits suivants sur vos données :
          </P>
          <Bullet>
            <B>Droit d&apos;accès</B> — obtenir copie des données vous
            concernant.
          </Bullet>
          <Bullet>
            <B>Droit de rectification</B> — corriger des données inexactes
            ou incomplètes.
          </Bullet>
          <Bullet>
            <B>Droit à l&apos;effacement</B> (droit à l&apos;oubli) —
            demander la suppression de vos données.
          </Bullet>
          <Bullet>
            <B>Droit à la limitation</B> du traitement.
          </Bullet>
          <Bullet>
            <B>Droit à la portabilité</B> — recevoir vos données dans un
            format structuré et lisible par machine.
          </Bullet>
          <Bullet>
            <B>Droit d&apos;opposition</B> au traitement fondé sur
            l&apos;intérêt légitime.
          </Bullet>
          <Bullet>
            <B>Droit de retirer votre consentement</B> à tout moment, sans
            que cela n&apos;affecte la licéité des traitements antérieurs.
          </Bullet>
          <Bullet>
            <B>Droit de définir des directives</B> relatives au sort de vos
            données après votre décès.
          </Bullet>
          <P>
            Pour exercer ces droits, contactez-nous à{" "}
            <B>contact@polynetia.com</B>. Une preuve d&apos;identité pourra
            être demandée en cas de doute raisonnable. Nous répondons dans
            un délai d&apos;un mois, prolongeable de deux mois si la demande
            est complexe.
          </P>
          <P>
            Vous pouvez également exercer la plupart de ces droits
            directement depuis l&apos;Application (édition du profil,
            suppression du compte).
          </P>
        </Section>

        <Section title="10. Cookies et traceurs">
          <P>
            L&apos;Application <B>n&apos;utilise pas de cookies publicitaires
            ni d&apos;outils de mesure d&apos;audience tiers</B> dans sa
            version actuelle. Seules les données techniques strictement
            nécessaires au fonctionnement de l&apos;Application sont
            stockées localement sur votre appareil (préférences utilisateur,
            session d&apos;authentification).
          </P>
        </Section>

        <Section title="11. Mineurs">
          <P>
            L&apos;Application est destinée aux personnes âgées de{" "}
            <B>13 ans ou plus</B>. Si nous apprenons qu&apos;un compte a
            été créé par un mineur de moins de 13 ans, nous procédons à sa
            suppression dans les meilleurs délais.
          </P>
        </Section>

        <Section title="12. Modifications de la présente politique">
          <P>
            Cette politique peut être mise à jour pour refléter des
            évolutions du service ou de la réglementation. La date de
            dernière mise à jour figure en tête de document. En cas de
            modification substantielle, vous serez informé par notification
            in-app ou par email.
          </P>
        </Section>

        <Section title="13. Réclamation auprès de la CNIL">
          <P>
            Si vous estimez, après nous avoir contactés, que vos droits ne
            sont pas respectés, vous pouvez introduire une réclamation
            auprès de la Commission nationale de l&apos;informatique et des
            libertés (CNIL) :
          </P>
          <Bullet>
            <B>3 place de Fontenoy — TSA 80715 — 75334 PARIS CEDEX 07.</B>
          </Bullet>
          <Bullet>
            <B>www.cnil.fr</B>
          </Bullet>
        </Section>

        <Section title="14. Contact">
          <P>
            Pour toute question relative à la présente politique ou à
            l&apos;exercice de vos droits, écrivez-nous à{" "}
            <B>contact@polynetia.com</B>.
          </P>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cremeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  topTitle: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 18,
    color: Colors.encre,
    flex: 1,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  h1: {
    fontFamily: "Fraunces_400Regular_Italic",
    fontSize: 28,
    color: Colors.encre,
    lineHeight: 34,
  },
  metaLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.cacao,
    fontStyle: "italic",
  },
  section: {
    paddingHorizontal: Spacing.screen,
    marginTop: 28,
    gap: 12,
  },
  h2: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 18,
    color: Colors.encre,
    lineHeight: 24,
  },
  h3: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Colors.sauge,
    marginTop: 6,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.encre,
    lineHeight: 22,
  },
  bold: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.encre,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.cacao,
    lineHeight: 22,
    width: 12,
  },
});
