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

export default function TermsScreen() {
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
        <Text style={styles.topTitle}>Conditions d&apos;utilisation</Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Conditions générales d&apos;utilisation</Text>
          <Text style={styles.metaLine}>Dernière mise à jour : {LAST_UPDATED}</Text>
        </View>

        <Section title="1. Préambule">
          <P>
            Les présentes Conditions Générales d&apos;Utilisation (ci-après «{" "}
            <B>CGU</B> ») régissent l&apos;utilisation de l&apos;application
            mobile <B>RecetteBox</B> (ci-après « l&apos;Application »), éditée
            par [ÉDITEUR_NOM_LEGAL].
          </P>
          <P>
            En téléchargeant, en installant ou en utilisant l&apos;Application,
            vous reconnaissez avoir lu, compris et accepté sans réserve
            l&apos;intégralité des présentes CGU. Si vous n&apos;acceptez pas
            ces conditions, vous devez cesser d&apos;utiliser
            l&apos;Application.
          </P>
        </Section>

        <Section title="2. Identification de l'éditeur">
          <P>
            <B>Éditeur :</B> [ÉDITEUR_NOM_LEGAL], [FORME_JURIDIQUE] au capital
            de [MONTANT_CAPITAL_OU_INDIVIDUEL].
          </P>
          <P>
            <B>Siège social :</B> [ADRESSE_POSTALE_COMPLÈTE].
          </P>
          <P>
            <B>Immatriculation :</B> [RCS_OU_SIRET].
          </P>
          <P>
            <B>Directeur de la publication :</B> [NOM_PRÉNOM_DIRECTEUR].
          </P>
          <P>
            <B>Contact :</B> contact@polynetia.com.
          </P>
        </Section>

        <Section title="3. Hébergement des données">
          <P>
            Les données de l&apos;Application sont hébergées par :
          </P>
          <Bullet>
            <B>Supabase</B> (base de données et stockage de fichiers) — région
            Union européenne (Francfort, Allemagne).
          </Bullet>
          <Bullet>
            <B>Railway</B> — serveur applicatif pour le traitement des imports.
          </Bullet>
          <Bullet>
            <B>Apple Push Notification Service</B> et <B>Firebase Cloud Messaging</B>{" "}
            (Google) — uniquement pour l&apos;acheminement des notifications push.
          </Bullet>
        </Section>

        <Section title="4. Description du service">
          <P>
            RecetteBox est une application mobile permettant à
            l&apos;utilisateur d&apos;importer des recettes depuis les réseaux
            sociaux (Instagram, TikTok). L&apos;Application utilise des
            services d&apos;intelligence artificielle pour transcrire
            l&apos;audio des vidéos, analyser les images, et reconstituer les
            ingrédients et les étapes sous forme de recette structurée.
          </P>
          <P>
            L&apos;Application propose également une fonctionnalité de liste
            de courses générée à partir des ingrédients d&apos;une recette,
            avec ajustement des portions.
          </P>
        </Section>

        <Section title="5. Acceptation et évolution des CGU">
          <P>
            L&apos;utilisation de l&apos;Application vaut acceptation pleine
            et entière des présentes CGU. L&apos;Éditeur se réserve le droit
            de modifier les CGU à tout moment. Les utilisateurs seront
            informés de toute modification substantielle par notification
            in-app ou par email. La poursuite de l&apos;utilisation après
            modification vaut acceptation des nouvelles conditions.
          </P>
        </Section>

        <Section title="6. Création de compte">
          <P>
            La création d&apos;un compte est nécessaire pour utiliser
            l&apos;Application. L&apos;utilisateur s&apos;engage à fournir des
            informations exactes et à les tenir à jour. Il est seul
            responsable de la confidentialité de ses identifiants.
          </P>
          <P>
            L&apos;Application est réservée aux personnes âgées de 13 ans ou
            plus. Les utilisateurs mineurs doivent obtenir l&apos;autorisation
            de leur représentant légal avant toute utilisation.
          </P>
          <P>
            L&apos;utilisateur peut supprimer son compte à tout moment depuis
            les paramètres de l&apos;Application. La suppression entraîne
            l&apos;effacement définitif des données associées dans les délais
            précisés dans la Politique de confidentialité.
          </P>
        </Section>

        <Section title="7. Abonnement et tarification">
          <P>
            L&apos;Application propose une version gratuite limitée à <B>3
            imports de recettes par mois calendaire</B>, ainsi qu&apos;un
            abonnement payant <B>RecetteBox Pro</B>.
          </P>
          <P>
            <B>Tarifs (susceptibles d&apos;évolution) :</B>
          </P>
          <Bullet>Abonnement mensuel : 6,99 € / mois.</Bullet>
          <Bullet>Abonnement annuel : 49,99 € / an.</Bullet>
          <P>
            L&apos;abonnement est souscrit via votre compte App Store (iOS) ou
            Google Play (Android). Le paiement est prélevé au moment de
            l&apos;achat, puis à chaque échéance par renouvellement
            automatique. L&apos;abonnement peut être résilié à tout moment
            depuis les réglages de votre compte App Store ou Google Play, au
            plus tard 24 heures avant la fin de la période en cours.
          </P>
          <P>
            Conformément à l&apos;article L. 221-28 du Code de la
            consommation, le droit de rétractation ne s&apos;applique pas aux
            contenus numériques dont l&apos;exécution a commencé avec votre
            accord exprès avant la fin du délai de rétractation.
          </P>
        </Section>

        <Section title="8. Contenu importé depuis des plateformes tierces">
          <P>
            L&apos;Application permet à l&apos;utilisateur d&apos;importer
            dans son carnet personnel des recettes à partir d&apos;URLs de
            publications publiques Instagram et TikTok.
          </P>
          <P>
            <B>Engagement de l&apos;utilisateur :</B> en partageant une URL
            avec l&apos;Application, l&apos;utilisateur déclare et garantit :
          </P>
          <Bullet>
            qu&apos;il dispose des droits nécessaires pour utiliser ce contenu
            dans le cadre de son usage personnel et privé ;
          </Bullet>
          <Bullet>
            qu&apos;il respecte les conditions d&apos;utilisation des
            plateformes sources (Instagram, TikTok) ;
          </Bullet>
          <Bullet>
            qu&apos;il n&apos;importera pas de contenu illicite, contrefaisant
            ou portant atteinte aux droits de tiers.
          </Bullet>
          <P>
            RecetteBox agit comme un outil technique permettant un usage
            personnel et privé du contenu importé (article L. 122-5 du Code
            de la propriété intellectuelle). <B>L&apos;Éditeur n&apos;est ni
            l&apos;auteur, ni le diffuseur, ni le responsable du contenu
            importé.</B> Toute responsabilité liée à l&apos;importation,
            au stockage ou à l&apos;utilisation d&apos;un contenu tiers
            incombe exclusivement à l&apos;utilisateur.
          </P>
          <P>
            L&apos;Éditeur se réserve le droit de retirer tout contenu
            signalé comme contrefaisant et de suspendre les comptes des
            utilisateurs en infraction répétée.
          </P>
        </Section>

        <Section title="9. Propriété intellectuelle">
          <P>
            <B>Application :</B> les marques, logos, interface, code source
            et bases de données sont la propriété exclusive de
            l&apos;Éditeur. Toute reproduction, représentation ou
            exploitation non autorisée est interdite.
          </P>
          <P>
            <B>Recettes importées :</B> l&apos;utilisateur conserve la
            pleine propriété des recettes qu&apos;il importe ou rédige dans
            son carnet personnel. L&apos;Éditeur ne revendique aucun droit
            sur ces contenus. L&apos;utilisateur accorde à l&apos;Éditeur
            une licence strictement limitée au stockage et à
            l&apos;affichage de ces contenus dans son carnet personnel, aux
            seules fins de fourniture du service.
          </P>
        </Section>

        <Section title="10. Limitations de responsabilité">
          <P>
            L&apos;Application repose sur des modèles d&apos;intelligence
            artificielle. Les recettes extraites le sont sur la base
            d&apos;une analyse <B>« best effort »</B> et peuvent contenir des
            erreurs, des oublis ou des imprécisions. L&apos;Éditeur ne
            garantit ni l&apos;exactitude, ni la sécurité alimentaire, ni
            l&apos;adéquation à un usage particulier des recettes générées.
          </P>
          <P>
            <B>Allergies et régimes spécifiques :</B> il appartient à
            l&apos;utilisateur de vérifier la liste des ingrédients avant
            toute préparation, en particulier en cas d&apos;allergie,
            d&apos;intolérance ou de régime médical. L&apos;Éditeur décline
            toute responsabilité en cas de dommage lié à la consommation
            d&apos;une recette extraite par l&apos;Application.
          </P>
          <P>
            L&apos;Application peut être temporairement indisponible pour
            des raisons de maintenance, de mise à jour, ou en cas
            d&apos;incident affectant les services tiers utilisés (Supabase,
            Railway, prestataires d&apos;IA, plateformes sources). Ces
            interruptions ne sauraient engager la responsabilité de
            l&apos;Éditeur.
          </P>
        </Section>

        <Section title="11. Données personnelles">
          <P>
            Le traitement des données à caractère personnel est décrit dans
            la <B>Politique de confidentialité</B>, accessible depuis
            l&apos;Application. L&apos;utilisateur dispose des droits prévus
            par le Règlement général sur la protection des données (RGPD).
          </P>
        </Section>

        <Section title="12. Résiliation">
          <P>
            L&apos;Éditeur peut suspendre ou résilier le compte d&apos;un
            utilisateur en cas de manquement grave ou répété aux présentes
            CGU, après notification, sauf cas où l&apos;urgence ou la
            gravité justifie une mesure immédiate (notamment en cas de
            contenu manifestement illicite).
          </P>
        </Section>

        <Section title="13. Droit applicable et juridiction">
          <P>
            Les présentes CGU sont régies par le droit [PAYS_DROIT_APPLICABLE,
            ex : français]. Tout litige relatif à leur interprétation ou à
            leur exécution relève de la compétence exclusive des tribunaux
            de [VILLE_JURIDICTION], sous réserve des dispositions légales
            impératives applicables aux consommateurs.
          </P>
          <P>
            Conformément aux articles L. 612-1 et suivants du Code de la
            consommation, le consommateur peut recourir gratuitement à un
            médiateur de la consommation en vue de la résolution amiable
            d&apos;un litige : [NOM_MÉDIATEUR_CONSOMMATION] — [URL_MÉDIATEUR].
          </P>
        </Section>

        <Section title="14. Contact">
          <P>
            Pour toute question relative aux présentes CGU, vous pouvez
            contacter l&apos;Éditeur à l&apos;adresse :{" "}
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
